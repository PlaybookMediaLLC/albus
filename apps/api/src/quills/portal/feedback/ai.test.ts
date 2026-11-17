import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vite-plus/test";
import { createId, toUuid } from "@kaneo/ids";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { boards } from "../../../database/quills/schema/boards";
import { DEFAULT_BOARD_ACCESS } from "../../../database/quills/types";
import * as kaneo from "../../../database/schema";
import {
  chatReply,
  provider,
  providerUrl,
} from "../../assistant/provider-edge.fixture";
import {
  contractApp,
  contractEnv,
  contractSession,
  startContract,
  stopContract,
} from "../../framework/contract";
import quillsRouter from "../../index";
import publicRouter from "../../public";
import { portalAiReply } from "./ai.fixture";
import { scene, type Scene } from "./seed.fixture";

// Feature checks for improveQuills{Portal,Widget}PostDraft that the contract cannot express: the
// board restriction on the input and the answer, the customer's text kept as written, the AI-off
// and monthly-limit refusals with the manual path, input bounds, the usage row and the
// per-account rate limit. Only the AI provider's HTTP edge is a test double.

let pool: Pool;
vi.mock("../../../database/index", () => ({
  getDatabasePool: () => pool,
  get schema() {
    return kaneo;
  },
  default: new Proxy(
    {},
    {
      get(_target, property) {
        const db = drizzle(pool, { schema: kaneo });
        const value = Reflect.get(db, property);
        return typeof value === "function" ? value.bind(db) : value;
      },
    },
  ),
}));
vi.mock("../../../utils/get-user-session", () => ({
  getUserSession: (headers: Headers) => contractSession(headers),
}));
const url = process.env.QUILLS_TEST_DATABASE_URL;
const app = contractApp(quillsRouter, publicRouter);
let client = 0;

type Options = { user?: string; workspace?: string; ip?: string };
async function portal(path: string, body: unknown, options: Options = {}) {
  const res = await app.request(
    `/quills-public/${options.workspace ?? contractEnv().a}/portal/${path}`,
    {
      method: "POST",
      headers: {
        "content-type": "application/json",
        ...(options.user !== "" && {
          "x-test-user": options.user ?? contractEnv().customerA,
        }),
        "x-kaneo-client-ip": options.ip ?? `203.0.113.${++client % 250}`,
      },
      body: JSON.stringify(body),
    },
  );
  return { status: res.status, body: await res.json() };
}
const improve = (body: unknown, options: Options = {}) =>
  portal("post-draft/improve", body, options);

/** Chat calls of the portal composer prompt since the last reset. */
const draftCalls = () =>
  provider.requests.filter((r) =>
    String(r.body?.messages?.[0]?.content).startsWith(
      "You help a customer write",
    ),
  );

/** A new board in A with these access changes. */
const board = (access: Partial<typeof DEFAULT_BOARD_ACCESS> = {}) =>
  contractEnv().scoped(
    contractEnv().a,
    async (db) =>
      (
        await db
          .insert(boards)
          .values({
            name: "Announcements",
            slug: contractEnv().id("board"),
            access: { ...DEFAULT_BOARD_ACCESS, ...access },
          })
          .returning({ id: boards.id })
      )[0]!.id,
  );
/** A board in A that customers see but may not post to. */
const readOnlyBoard = () => board({ submit: "team" });

const usageRows = async (workspaceId: string) =>
  (
    await pool.query(
      "SELECT pipeline_step, call_type, total_tokens FROM quills.ai_usage_log WHERE workspace_id=$1 AND pipeline_step='portal_post_draft'",
      [workspaceId],
    )
  ).rows;

describe.skipIf(!url)("Quills portal composer AI help", () => {
  let s: Scene;
  beforeAll(async () => {
    pool = new Pool({ connectionString: url, max: 5 });
    await startContract(pool, url!);
    s = await scene(contractEnv(), "portal");
  }, 120000);
  // Each check starts with fresh rate-limit counters; the last two checks spend them on purpose.
  beforeEach(async () => {
    await pool.query("DELETE FROM quills.rate_bucket WHERE workspace_id=$1", [
      contractEnv().a,
    ]);
  });
  afterAll(async () => {
    provider.reply(portalAiReply);
    await stopContract();
  });

  it("returns a bounded suggestion, logs the usage and stores nothing else", async () => {
    provider.requests.length = 0;
    provider.reply(() =>
      chatReply({ title: "T".repeat(300), boardId: s.a.boardId }),
    );
    const events = async () =>
      (
        await pool.query(
          "SELECT count(*)::int AS n FROM quills.events WHERE workspace_id=$1",
          [contractEnv().a],
        )
      ).rows[0].n;
    const before = await events();
    const used = (await usageRows(contractEnv().a)).length;
    const res = await improve({ title: "csv", details: "send reports" });
    expect(res.status).toBe(200);
    const [{ name }] = (
      await pool.query("SELECT name FROM quills.boards WHERE id=$1", [
        toUuid(s.a.boardId as never),
      ])
    ).rows;
    expect(res.body).toEqual({
      title: "T".repeat(200),
      boardId: s.a.boardId,
      boardName: name,
    });
    const rows = await usageRows(contractEnv().a);
    expect(rows).toHaveLength(used + 1);
    expect(rows).toContainEqual({
      pipeline_step: "portal_post_draft",
      call_type: "chat_completion",
      total_tokens: 20,
    });
    expect(await events()).toBe(before);
    // The customer's text reaches the model as data, with the boards the caller may post to only.
    const [call] = draftCalls();
    const prompt = call!.body.messages[1].content as string;
    expect(prompt).toContain("<draft>");
    expect(prompt).toContain("send reports");
    expect(prompt).toContain(s.a.boardId);
    for (const value of [...s.a.hidden, s.b.boardId, s.b.postTitle])
      expect(prompt).not.toContain(value);
  });

  it("never suggests a board the caller cannot post to", async () => {
    const readOnly = await readOnlyBoard();
    for (const suggested of [readOnly, s.b.boardId, "board_made_up"]) {
      provider.reply(() => chatReply({ title: "Title", boardId: suggested }));
      const free = await improve({ title: "csv", details: "" });
      expect(free.status).toBe(200);
      expect(free.body.boardId).toBeNull();
      const kept = await improve({
        title: "csv",
        details: "",
        boardId: s.a.boardId,
      });
      expect(kept.body.boardId).toBe(s.a.boardId);
    }
  });

  it("suggests another board that takes the caller's posts over the given one", async () => {
    const reports = await board();
    provider.reply(() => chatReply({ title: "Title", boardId: reports }));
    const res = await improve({
      title: "csv",
      details: "",
      boardId: s.a.boardId,
    });
    expect(res.body.boardId).toBe(reports);
  });

  it("refuses a board the caller cannot post to, without an AI call", async () => {
    provider.requests.length = 0;
    provider.reply(portalAiReply);
    const readOnly = await readOnlyBoard();
    const refused = await improve({
      title: "csv",
      details: "",
      boardId: readOnly,
    });
    expect(refused.status).toBe(403);
    // A board in workspace B and a team-only board in A answer like a missing board.
    const missing = await improve({
      title: "csv",
      details: "",
      boardId: createId("board"),
    });
    expect(missing.status).toBe(404);
    for (const boardId of [s.b.boardId, await board({ view: "team" })])
      expect(await improve({ title: "csv", details: "", boardId })).toEqual(
        missing,
      );
    expect(draftCalls()).toHaveLength(0);
    // Workspace B's own customer path cannot reach A's boards either.
    const crossed = await improve(
      { title: "csv", details: "", boardId: s.a.boardId },
      { workspace: contractEnv().b },
    );
    expect(crossed.status).toBe(404);
  });

  it("saves nothing until the customer submits, and then only their words and the confirmed title", async () => {
    // The model may answer with extra text: only the title and the board are used.
    provider.reply(() =>
      chatReply({
        title: "Export reports as CSV",
        boardId: s.a.boardId,
        problem: "Invented details",
        content: "Invented details",
      }),
    );
    const count = async () =>
      (
        await pool.query(
          "SELECT count(*)::int AS n FROM quills.posts WHERE workspace_id=$1",
          [contractEnv().a],
        )
      ).rows[0].n;
    const before = await count();
    const words = "ich muss Berichte an meinen Chef schicken\nals CSV bitte";
    const draft = await improve({ title: "", details: words });
    expect(draft.status).toBe(200);
    expect(Object.keys(draft.body).sort()).toEqual([
      "boardId",
      "boardName",
      "title",
    ]);
    expect(await count()).toBe(before);
    const saved = await portal("posts", {
      boardId: draft.body.boardId,
      title: draft.body.title,
      content: words,
    });
    expect(saved.status).toBe(200);
    const [row] = (
      await pool.query(
        "SELECT title, content, board_id FROM quills.posts WHERE id=$1",
        [toUuid(saved.body.id)],
      )
    ).rows;
    expect(row).toEqual({
      title: "Export reports as CSV",
      content: words,
      board_id: toUuid(s.a.boardId as never),
    });
  });

  it("rejects a board of another workspace when the post is submitted", async () => {
    const res = await portal("posts", {
      boardId: s.b.boardId,
      title: "Export",
      content: "csv",
    });
    expect(res.status).toBe(404);
    expect(JSON.stringify(res.body)).not.toContain(s.b.postTitle);
  });

  it("stops at the workspace's monthly AI limit, keeps the manual path, and counts each workspace alone", async () => {
    provider.requests.length = 0;
    provider.reply(portalAiReply);
    // Every earlier call in A logged tokens, here past the limit; B logged none.
    await pool.query(
      "UPDATE quills.ai_usage_log SET total_tokens = 100000 WHERE workspace_id=$1",
      [contractEnv().a],
    );
    vi.stubEnv("QUILLS_AI_MONTHLY_TOKEN_LIMIT", "100000");
    try {
      const limited = await improve({ title: "csv", details: "" });
      expect(limited.status).toBe(409);
      expect(limited.body.message).toBe(
        "The workspace reached its monthly AI limit",
      );
      expect(draftCalls()).toHaveLength(0);
      const manual = await portal("posts", {
        boardId: s.a.boardId,
        title: "Written by hand",
        content: "no AI",
      });
      expect(manual.status).toBe(200);
      // Workspace B has its own month: A's usage never stops B's customers.
      const user = contractEnv().customerB;
      await contractEnv().portalCustomer(contractEnv().b, user);
      const other = await improve(
        { title: "csv", details: "" },
        { workspace: contractEnv().b, user },
      );
      expect(other.status).toBe(200);
      expect(other.body.boardId).toBe(null);
      // A last month's usage does not count.
      await pool.query(
        "UPDATE quills.ai_usage_log SET created_at = date_trunc('month', now()) - interval '1 day' WHERE workspace_id=$1",
        [contractEnv().a],
      );
      expect((await improve({ title: "csv", details: "" })).status).toBe(200);
    } finally {
      vi.stubEnv("QUILLS_AI_MONTHLY_TOKEN_LIMIT", "");
    }
  });

  it("reserves each call's ceiling first, so parallel calls cannot pass the limit together", async () => {
    const a = contractEnv().a;
    const rows = async (status: string) =>
      (
        await pool.query(
          "SELECT total_tokens::int AS tokens FROM quills.ai_usage_log WHERE workspace_id=$1 AND status=$2 AND created_at >= date_trunc('month', now())",
          [a, status],
        )
      ).rows as Array<{ tokens: number }>;
    // Start the month empty: earlier tests logged usage in A.
    await pool.query(
      "UPDATE quills.ai_usage_log SET created_at = date_trunc('month', now()) - interval '1 day' WHERE workspace_id=$1",
      [a],
    );
    let open!: () => void;
    const gate = new Promise<void>((resolve) => (open = resolve));
    provider.requests.length = 0;
    provider.reply(async (request) => {
      await gate;
      return portalAiReply(request);
    });
    vi.stubEnv("QUILLS_AI_MONTHLY_TOKEN_LIMIT", "1000000");
    try {
      const first = improve({ title: "csv", details: "monthly export" });
      await vi.waitFor(async () =>
        expect(await rows("reserved")).toHaveLength(1),
      );
      const ceiling = (await rows("reserved"))[0]!.tokens;
      expect(ceiling).toBeGreaterThan(300);
      // Room for one ceiling only: the second call is refused while the first one runs.
      vi.stubEnv("QUILLS_AI_MONTHLY_TOKEN_LIMIT", String(2 * ceiling - 1));
      const second = await improve({ title: "csv", details: "monthly export" });
      expect(second.status).toBe(409);
      expect(second.body.message).toBe(
        "The workspace reached its monthly AI limit",
      );
      open();
      expect((await first).status).toBe(200);
      expect(draftCalls()).toHaveLength(1);
      // The reservation became the real usage, which leaves room for the next call.
      expect(await rows("reserved")).toHaveLength(0);
      expect((await rows("success")).map((row) => row.tokens)).toEqual([20]);
      // A failed call keeps its reservation until it expires.
      provider.reply(() => ({ status: 500, json: {} }));
      expect(
        (await improve({ title: "csv", details: "monthly export" })).status,
      ).toBe(502);
      expect(await rows("reserved")).toHaveLength(1);
      provider.reply(portalAiReply);
      expect(
        (await improve({ title: "csv", details: "monthly export" })).status,
      ).toBe(409);
      await pool.query(
        "UPDATE quills.ai_usage_log SET created_at = now() - interval '6 minutes' WHERE workspace_id=$1 AND status='reserved'",
        [a],
      );
      expect(
        (await improve({ title: "csv", details: "monthly export" })).status,
      ).toBe(200);
      expect(await rows("reserved")).toHaveLength(0);
    } finally {
      open();
      provider.reply(portalAiReply);
      vi.stubEnv("QUILLS_AI_MONTHLY_TOKEN_LIMIT", "");
    }
  });

  it("drafts in the widget too: same board limits, and the post keeps the visitor's words", async () => {
    provider.reply(() =>
      chatReply({ title: "Dark mode", boardId: s.b.boardId }),
    );
    const { token } = await contractEnv().widgetVisitor(contractEnv().a);
    const widget = async (path: string, body: unknown) => {
      const res = await app.request(
        `/quills-public/${contractEnv().a}/widget/${path}`,
        {
          method: "POST",
          headers: {
            "content-type": "application/json",
            authorization: `Bearer ${token}`,
            "x-kaneo-client-ip": `203.0.113.${++client % 250}`,
          },
          body: JSON.stringify(body),
        },
      );
      return { status: res.status, body: await res.json() };
    };
    const words = "please add a dark theme, my eyes hurt at night";
    const draft = await widget("post-draft/improve", {
      title: "",
      details: words,
    });
    expect(draft.status).toBe(200);
    // The model named a board of workspace B: it is dropped.
    expect(draft.body).toEqual({
      title: "Dark mode",
      boardId: null,
      boardName: null,
    });
    expect(
      (
        await widget("post-draft/improve", {
          title: "",
          details: words,
          boardId: s.b.boardId,
        })
      ).status,
    ).toBe(404);
    const saved = await widget("posts", {
      title: draft.body.title,
      content: words,
      boardId: s.a.boardId,
    });
    expect(saved.status).toBe(200);
    const [row] = (
      await pool.query("SELECT title, content FROM quills.posts WHERE id=$1", [
        toUuid(saved.body.id),
      ])
    ).rows;
    expect(row).toEqual({ title: "Dark mode", content: words });
    expect(
      (
        await widget("posts", {
          title: "x",
          content: words,
          boardId: s.b.boardId,
        })
      ).status,
    ).toBe(404);
    provider.reply(portalAiReply);
  });

  it("asks a visitor to sign in", async () => {
    const res = await improve({ title: "csv", details: "" }, { user: "" });
    expect(res.status).toBe(401);
  });

  it("refuses with 409 when AI is off and 502 when the provider fails", async () => {
    provider.requests.length = 0;
    vi.stubEnv("QUILLS_AI_BASE_URL", "");
    const off = await improve({ title: "csv", details: "" });
    vi.stubEnv("QUILLS_AI_BASE_URL", providerUrl);
    expect(off.status).toBe(409);
    expect(off.body.message).toBe("AI is not configured");
    expect(draftCalls()).toHaveLength(0);
    provider.reply(() => ({ status: 500, json: { error: "provider secret" } }));
    const failed = await improve({ title: "csv", details: "" });
    expect(failed.status).toBe(502);
    expect(JSON.stringify(failed.body)).not.toContain("provider secret");
    provider.reply(portalAiReply);
  });

  it("bounds the input", async () => {
    for (const body of [
      { title: "a".repeat(201), details: "" },
      { title: "", details: "a".repeat(4001) },
      { title: "", details: "  " },
      { title: "csv", details: "", boardId: "not-a-board" },
    ])
      expect((await improve(body)).status).toBe(400);
  });

  it("allows 10 suggestions per account in 10 minutes, from any address", async () => {
    provider.reply(portalAiReply);
    const user = contractEnv().customerB;
    await contractEnv().portalCustomer(contractEnv().a, user);
    for (let i = 0; i < 10; i++)
      expect(
        (await improve({ title: "csv", details: "" }, { user })).status,
      ).toBe(200);
    const limited = await improve({ title: "csv", details: "" }, { user });
    expect(limited.status).toBe(429);
    // Another account keeps its own budget.
    expect((await improve({ title: "csv", details: "" })).status).toBe(200);
    // Eleven requests with an AI call each need more than the 5-second default on a busy machine.
  }, 30000);

  it("allows 10 suggestions per address in 10 minutes, for all accounts together", async () => {
    provider.reply(portalAiReply);
    const ip = "198.51.100.9";
    const customerB = contractEnv().customerB;
    await contractEnv().portalCustomer(contractEnv().a, customerB);
    for (let i = 0; i < 10; i++)
      expect(
        (
          await improve(
            { title: "csv", details: "" },
            { ip, user: i % 2 ? customerB : undefined },
          )
        ).status,
      ).toBe(200);
    const limited = await improve({ title: "csv", details: "" }, { ip });
    expect(limited.status).toBe(429);
    // Eleven requests with an AI call each need more than the 5-second default on a busy machine.
  }, 30000);
});
