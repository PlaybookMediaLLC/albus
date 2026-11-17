import { afterAll, beforeAll, describe, expect, it, vi } from "vite-plus/test";
import { toUuid } from "@kaneo/ids";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as kaneo from "../../database/schema";
import { helpSeed } from "../content/public/seed.fixture";
import {
  contractApp,
  contractEnv,
  contractSession,
  startContract,
  stopContract,
} from "../framework/contract";
import quillsRouter from "../index";
import { world } from "../portal/feedback/seed.fixture";
import publicRouter from "../public";
import { enableWidget, signIdentity } from "./seed.fixture";
import { withQuillsSystemWorkspace } from "../../database/quills/client";
import {
  chatReply,
  provider,
  providerUrl,
} from "../assistant/provider-edge.fixture";
import { titleUntitledPost } from "../assistant/engine/post-title";
import { checkPostImages } from "../assistant/engine/post-images";
import { readGrant } from "../framework/portal-sign-in";
import { answerCustomer } from "../assistant/engine/customer-agent";
import { runQuillsSweeps } from "../jobs/handlers/sweeps";
import { loadEvent } from "../jobs/fanout";

// The record and ownership checks of the widget host E2E (docs/quills-port/widget-e2e-report.md),
// without a browser: every widget write lands on the identified person, with its outbox event.

let pool: Pool;
vi.mock("../../database/index", () => ({
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
// The image check reads stored bytes; the test storage has none.
vi.mock("../framework/files", async (original) => ({
  ...(await original<typeof import("../framework/files")>()),
  readObject: vi.fn(async () => Buffer.from("fake-png")),
}));
vi.mock("../../utils/get-user-session", () => ({
  getUserSession: (headers: Headers) => contractSession(headers),
}));
const url = process.env.QUILLS_TEST_DATABASE_URL;
const app = contractApp(quillsRouter, publicRouter);
/** Seeded IDs are UUIDs; route responses are TypeIDs. */
const uuid = (id: string) => (id.includes("_") ? toUuid(id) : id);
const exp = (offset = 300) => Math.floor(Date.now() / 1000) + offset;

async function call(
  method: string,
  path: string,
  options: { bearer?: string; body?: unknown; ip?: string } = {},
) {
  const res = await app.request(`/quills-public/${contractEnv().a}${path}`, {
    method,
    headers: {
      // The test app has no client IP middleware: this is the address it would resolve.
      ...(options.ip && { "x-kaneo-client-ip": options.ip }),
      ...(options.bearer && { authorization: `Bearer ${options.bearer}` }),
      ...(options.body !== undefined && { "content-type": "application/json" }),
    },
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
  });
  return { status: res.status, body: await res.json().catch(() => null) };
}

describe.skipIf(!url)("widget records and ownership", () => {
  let secret: string;
  let feedback: Awaited<ReturnType<typeof world>>;
  let help: Awaited<ReturnType<typeof helpSeed>>;
  beforeAll(async () => {
    pool = new Pool({ connectionString: url, max: 5 });
    await startContract(pool, url!);
    const env = contractEnv();
    secret = await enableWidget(env, env.a);
    feedback = await world(env, env.a);
    help = await helpSeed(env);
  }, 120000);
  afterAll(() => stopContract());

  const identify = (claims: Record<string, unknown>, key = secret) =>
    call("POST", "/widget/identify", {
      body: { ssoToken: signIdentity(claims, key) },
    });
  const visitor = async () => {
    const sub = contractEnv().id("sub");
    const res = await identify({
      sub,
      email: `${sub}@example.test`,
      exp: exp(),
    });
    expect(res.status).toBe(200);
    return {
      sub,
      token: res.body.sessionToken as string,
      principal: toUuid(res.body.principalId),
    };
  };
  /** The signed sub of the person who owns a principal. */
  const subOf = async (principalId: string) =>
    (
      await pool.query(
        "SELECT c.external_id FROM quills.principal p JOIN quills.customer_identity c ON c.id = p.user_id WHERE p.id = $1",
        [principalId],
      )
    ).rows[0]?.external_id;
  const outbox = async (entityId: string) =>
    (
      await pool.query(
        "SELECT type, actor_id FROM quills.events WHERE workspace_id = $1 AND entity_id = $2 ORDER BY id",
        [contractEnv().a, entityId],
      )
    ).rows as { type: string; actor_id: string | null }[];
  const owners = async (table: string, where: string, args: unknown[]) =>
    (
      await pool.query(
        `SELECT principal_id FROM quills.${table} WHERE workspace_id = $1 AND ${where}`,
        [contractEnv().a, ...args],
      )
    ).rows.map((row) => row.principal_id as string);

  it("ties every widget write to the identified person, with its outbox event", async () => {
    const ada = await visitor();
    const bearer = ada.token;
    expect(await subOf(ada.principal)).toBe(ada.sub);

    const post = await call("POST", "/widget/posts", {
      bearer,
      body: {
        content: "Export boards as CSV\nFor finance.",
        idempotencyKey: contractEnv().id("key"),
        metadata: {
          plan: "pro",
          pageUrl: "https://host.test/app",
          browser: "Chrome 131 on macOS",
        },
      },
    });
    expect(post.status).toBe(200);
    const postRow = (
      await pool.query(
        "SELECT principal_id, widget_metadata FROM quills.posts WHERE id = $1",
        [toUuid(post.body.id)],
      )
    ).rows[0];
    expect(postRow.principal_id).toBe(ada.principal);
    expect(postRow.widget_metadata).toEqual({
      plan: "pro",
      pageUrl: "https://host.test/app",
      browser: "Chrome 131 on macOS",
    });
    expect((await outbox(post.body.id)).map((e) => e.type)).toContain(
      "post.created",
    );

    const target = feedback.postId;
    const vote = (voted: boolean) =>
      call("PUT", `/widget/posts/${target}/vote`, { bearer, body: { voted } });
    expect((await vote(true)).status).toBe(200);
    expect(
      await owners("post_votes", "post_id = $2", [uuid(target)]),
    ).toContain(ada.principal);
    expect((await vote(false)).status).toBe(200);
    expect(
      await owners("post_votes", "post_id = $2", [uuid(target)]),
    ).not.toContain(ada.principal);

    const comment = await call("POST", `/widget/posts/${target}/comments`, {
      bearer,
      body: { content: "Me too", idempotencyKey: contractEnv().id("key") },
    });
    expect(comment.status).toBe(200);
    expect(
      await owners("post_comments", "id = $2", [toUuid(comment.body.id)]),
    ).toEqual([ada.principal]);
    expect((await outbox(comment.body.id)).map((e) => e.type)).toContain(
      "comment.created",
    );

    const follow = await call("PUT", `/widget/posts/${target}/follow`, {
      bearer,
      body: { following: true },
    });
    expect(follow.status).toBe(200);
    expect(
      await owners("post_subscriptions", "post_id = $2", [uuid(target)]),
    ).toContain(ada.principal);

    const started = await call("POST", "/widget/conversations", {
      bearer,
      body: {
        content: "Hello",
        idempotencyKey: contractEnv().id("key"),
        metadata: { pageUrl: "https://host.test/app", browser: "Chrome" },
      },
    });
    expect(started.status).toBe(200);
    const conversationId = started.body.conversation.id as string;
    const reply = await call(
      "POST",
      `/widget/conversations/${conversationId}/messages`,
      {
        bearer,
        body: { content: "More", idempotencyKey: contractEnv().id("key") },
      },
    );
    expect(reply.status).toBe(200);
    expect(
      (
        await pool.query(
          "SELECT visitor_principal_id FROM quills.conversations WHERE id = $1",
          [toUuid(conversationId)],
        )
      ).rows[0].visitor_principal_id,
    ).toBe(ada.principal);
    expect(
      await owners("conversation_messages", "conversation_id = $2", [
        toUuid(conversationId),
      ]),
    ).toEqual([ada.principal, ada.principal]);
    expect((await outbox(conversationId)).map((e) => e.type)).toContain(
      "conversation.created",
    );
    expect((await outbox(reply.body.message.id)).map((e) => e.type)).toContain(
      "message.created",
    );

    const article = help.a.published.id;
    const helpful = await call(
      "PUT",
      `/widget/help/articles/${article}/feedback`,
      { bearer, body: { helpful: true } },
    );
    expect(helpful.status).toBe(200);
    expect(
      await owners("kb_article_feedback", "article_id = $2", [uuid(article)]),
    ).toContain(ada.principal);

    const reacted = await call(
      "PUT",
      `/widget/changelog/${feedback.entryId}/reactions`,
      { bearer, body: { emoji: "🎉", reacted: true } },
    );
    expect(reacted.status).toBe(200);
    expect(
      await owners("changelog_reactions", "changelog_entry_id = $2", [
        uuid(feedback.entryId),
      ]),
    ).toContain(ada.principal);
  });

  it("links the token's company, reads traits and name parts, and reports dropped claims", async () => {
    const sub = contractEnv().id("sub");
    const company = contractEnv().id("acme");
    const domain = `${company.replace(/_/g, "-")}.example.test`;
    const res = await identify({
      sub,
      email: `${sub}@example.test`,
      exp: exp(),
      firstName: "Ada",
      lastName: "Lovelace",
      traits: { unknownTrait: "x" },
      segments: ["no-such-segment"],
      companies: [
        { id: company, name: "Acme", domain },
        { id: "second", name: "Ignored" },
      ],
    });
    expect(res.status).toBe(200);
    expect(res.body.user.name).toBe("Ada Lovelace");
    expect(res.body.warnings).toEqual([
      { code: "ATTRIBUTE_IGNORED", field: "unknownTrait" },
      { code: "SEGMENT_IGNORED", field: "segments:no-such-segment" },
      { code: "COMPANY_IGNORED", field: "companies[1]" },
    ]);
    const linked = await pool.query(
      "SELECT c.external_id, c.name, c.domain FROM quills.principal p JOIN quills.companies c ON c.id = p.company_id WHERE p.id = $1",
      [toUuid(res.body.principalId)],
    );
    expect(linked.rows).toEqual([
      { external_id: company, name: "Acme", domain },
    ]);
    // A later identify updates the same company by its id.
    const again = await identify({
      sub,
      email: `${sub}@example.test`,
      exp: exp(),
      companies: [{ id: company, name: "Acme Inc" }],
    });
    expect(again.body.warnings).toEqual([]);
    const rows = await pool.query(
      "SELECT name FROM quills.companies WHERE workspace_id = $1 AND external_id = $2",
      [contractEnv().a, company],
    );
    expect(rows.rows).toEqual([{ name: "Acme Inc" }]);
  });

  it("lists only the visitor's own activity on posts they can see, and marks it read", async () => {
    const ada = await visitor();
    const grace = await visitor();
    const notify = (postId: string, owner: string) =>
      pool
        .query(
          "INSERT INTO quills.in_app_notifications (id, workspace_id, principal_id, type, title, body, post_id) VALUES (gen_random_uuid(), $1, $2, 'comment_created', 'Someone commented', 'A reply', $3) RETURNING id",
          [contractEnv().a, owner, uuid(postId)],
        )
        .then((r) => r.rows[0].id as string);
    const visible = await notify(feedback.postId, ada.principal);
    await notify(feedback.segmentPostId, ada.principal);
    await notify(feedback.postId, grace.principal);
    const list = await call("GET", "/widget/activity", { bearer: ada.token });
    expect(list.status).toBe(200);
    expect(list.body.items).toHaveLength(1);
    expect(list.body.items[0]).toMatchObject({
      kind: "reply",
      unread: true,
      summary: "A reply",
    });
    expect(list.body.unreadCount).toBe(1);
    const id = list.body.items[0].id as string;
    expect(uuid(id)).toBe(visible);
    // Another visitor cannot read or mark Ada's item.
    expect(
      (
        await call("PUT", `/widget/activity/${id}/read`, {
          bearer: grace.token,
        })
      ).status,
    ).toBe(404);
    for (let i = 0; i < 2; i++) {
      const read = await call("PUT", `/widget/activity/${id}/read`, {
        bearer: ada.token,
      });
      expect(read.status).toBe(200);
      expect(read.body).toMatchObject({
        item: { unread: false },
        unreadCount: 0,
      });
    }
    expect((await call("GET", "/widget/activity")).status).toBe(401);
  });

  it("subscribes an identified visitor to updates and refuses an anonymous one", async () => {
    const ada = await visitor();
    const path = "/widget/changelog/subscription";
    const rows = async () =>
      (
        await pool.query(
          "SELECT source, unsubscribed_at FROM quills.changelog_subscriptions WHERE workspace_id = $1 AND principal_id = $2",
          [contractEnv().a, ada.principal],
        )
      ).rows;
    expect((await call("DELETE", path, { bearer: ada.token })).status).toBe(
      200,
    );
    expect((await call("GET", path, { bearer: ada.token })).body).toEqual({
      subscribed: false,
    });
    expect((await call("PUT", path, { bearer: ada.token })).body).toEqual({
      subscribed: true,
    });
    expect((await call("GET", path, { bearer: ada.token })).body).toEqual({
      subscribed: true,
    });
    expect(await rows()).toMatchObject([{ unsubscribed_at: null }]);
    const anonymous = (await call("POST", "/widget/anonymous-session")).body
      .sessionToken as string;
    expect((await call("PUT", path, { bearer: anonymous })).status).toBe(403);
    expect((await call("GET", path, { bearer: anonymous })).body).toEqual({
      subscribed: false,
    });
    expect((await call("GET", path)).status).toBe(401);
  });

  it("hides a request that the team hid from everyone but its author", async () => {
    const ada = await visitor();
    const grace = await visitor();
    const created = await call("POST", "/widget/posts", {
      bearer: ada.token,
      body: { content: `Private idea ${contractEnv().id("t")}` },
    });
    expect(created.status).toBe(200);
    const id = created.body.id as string;
    const teammate = (isHidden: boolean) =>
      app.request(`/quills/${contractEnv().a}/posts/${id}/visibility`, {
        method: "PUT",
        headers: {
          "x-test-user": contractEnv().owner,
          "content-type": "application/json",
        },
        body: JSON.stringify({ visible: true, authorOnly: isHidden }),
      });
    const hidden = await teammate(true);
    expect(hidden.status).toBe(200);
    expect(((await hidden.json()) as { isHidden: boolean }).isHidden).toBe(
      true,
    );
    const listed = async (bearer: string) =>
      (
        (await call("GET", "/widget/posts?limit=50&sort=newest", { bearer }))
          .body.items as {
          id: string;
        }[]
      ).some((item) => item.id === id);
    expect(
      (await call("GET", `/widget/posts/${id}`, { bearer: grace.token }))
        .status,
    ).toBe(404);
    expect(await listed(grace.token)).toBe(false);
    expect(
      (await call("GET", `/widget/posts/${id}`, { bearer: ada.token })).status,
    ).toBe(200);
    expect(await listed(ada.token)).toBe(true);
    expect((await teammate(false)).status).toBe(200);
    expect(
      (await call("GET", `/widget/posts/${id}`, { bearer: grace.token }))
        .status,
    ).toBe(200);
    const activity = await pool.query(
      "SELECT type FROM quills.post_activity WHERE post_id = $1 ORDER BY created_at",
      [uuid(id)],
    );
    expect(activity.rows.map((row) => row.type)).toEqual(
      expect.arrayContaining(["post.hidden", "post.shown"]),
    );
  });

  it("lets AI title a one-sentence request after it is posted, and leaves it alone without AI", async () => {
    const ada = await visitor();
    const post = async () => {
      const created = await call("POST", "/widget/posts", {
        bearer: ada.token,
        body: {
          content: "the export button does nothing when i click it on safari",
        },
      });
      expect(created.status).toBe(200);
      const [event] = (
        await pool.query(
          "SELECT event_id, payload FROM quills.events WHERE workspace_id = $1 AND type = 'post.created' AND entity_id = $2",
          [contractEnv().a, created.body.id],
        )
      ).rows;
      expect(event.payload).toMatchObject({ untitled: "true" });
      const loaded = await withQuillsSystemWorkspace(contractEnv().a, (db) =>
        loadEvent(db, event.event_id),
      );
      return { id: created.body.id as string, event: loaded! };
    };
    const titleOf = async (id: string) =>
      (
        await pool.query("SELECT title FROM quills.posts WHERE id = $1", [
          uuid(id),
        ])
      ).rows[0].title as string;

    provider.reply(() =>
      chatReply({ title: "Export button fails in Safari", board: 0 }),
    );
    const first = await post();
    const write = await titleUntitledPost(contractEnv().a, first.event);
    await withQuillsSystemWorkspace(contractEnv().a, write);
    expect(await titleOf(first.id)).toBe("Export button fails in Safari");
    const updated = (
      await pool.query(
        "SELECT payload FROM quills.events WHERE workspace_id = $1 AND type = 'post.updated' AND entity_id = $2",
        [contractEnv().a, first.id],
      )
    ).rows;
    expect(updated[0]?.payload).toMatchObject({ source: "ai" });

    vi.stubEnv("QUILLS_AI_BASE_URL", "");
    try {
      const second = await post();
      const before = provider.requests.length;
      await withQuillsSystemWorkspace(
        contractEnv().a,
        await titleUntitledPost(contractEnv().a, second.event),
      );
      expect(provider.requests.length).toBe(before);
      expect(await titleOf(second.id)).toBe(
        "the export button does nothing when i click it on safari",
      );
    } finally {
      vi.stubEnv("QUILLS_AI_BASE_URL", providerUrl);
      provider.reply();
    }
  });

  it("lets the customer agent answer, propose one request, hand off with a note, and close a quiet chat", async () => {
    const assistant = async (body: object) => {
      const path = `/quills/${contractEnv().a}/assistant/settings`;
      const headers = {
        "x-test-user": contractEnv().owner,
        "content-type": "application/json",
      };
      const { revision } = await (await app.request(path, { headers })).json();
      return app.request(path, {
        method: "PATCH",
        headers,
        body: JSON.stringify({ revision, ...body }),
      });
    };
    const eventOf = async (type: string, entityId: string) => {
      const [row] = (
        await pool.query(
          "SELECT event_id FROM quills.events WHERE workspace_id = $1 AND type = $2 AND entity_id = $3",
          [contractEnv().a, type, entityId],
        )
      ).rows;
      return (await withQuillsSystemWorkspace(contractEnv().a, (db) =>
        loadEvent(db, row.event_id),
      ))!;
    };
    const run = async (type: string, entityId: string) =>
      withQuillsSystemWorkspace(
        contractEnv().a,
        await answerCustomer(contractEnv().a, await eventOf(type, entityId)),
      );
    const agent = (value: object) =>
      provider.reply(({ path }) =>
        path.endsWith("/embeddings")
          ? {
              json: {
                data: [{ index: 0, embedding: Array(1536).fill(0.01) }],
                usage: { prompt_tokens: 1, total_tokens: 1 },
              },
            }
          : chatReply({
              handoff: null,
              feedback: null,
              sourceIds: [],
              ...value,
            }),
      );
    type Message = {
      id: string;
      senderType: string;
      content: string;
      fromAssistant: boolean;
      feedbackCard: { status: string; postId: string | null } | null;
    };
    const ada = await visitor();
    const messagesOf = async (id: string) =>
      (
        await call("GET", `/widget/conversations/${id}/messages`, {
          bearer: ada.token,
        })
      ).body.items as Message[];
    const send = async (id: string, content: string) => {
      const sent = await call("POST", `/widget/conversations/${id}/messages`, {
        bearer: ada.token,
        body: { content, idempotencyKey: contractEnv().id("key") },
      });
      return sent.body.message.id as string;
    };

    expect(
      (
        await assistant({
          agentEnabled: true,
          agentProductDescription: "A CSV exporter",
        })
      ).status,
    ).toBe(200);
    try {
      const started = await call("POST", "/widget/conversations", {
        bearer: ada.token,
        body: {
          content: "Could you add a PDF export?",
          idempotencyKey: contractEnv().id("key"),
        },
      });
      const id = started.body.conversation.id as string;
      agent({
        reply: "Not yet. I can pass it to the team as a request.",
        feedback: { title: "PDF export", body: "Export reports as PDF" },
      });
      await run("conversation.created", id);
      const prompt = JSON.stringify(provider.requests.at(-1)!.body);
      expect(prompt).toContain("A CSV exporter");
      let messages = await messagesOf(id);
      const answer = messages.find((m) => m.fromAssistant)!;
      expect(answer).toMatchObject({
        senderType: "agent",
        content: "Not yet. I can pass it to the team as a request.",
        feedbackCard: { status: "proposed", postId: null },
      });

      // A second request in the same conversation is never proposed.
      agent({
        reply: "Noted.",
        feedback: { title: "Dark mode", body: "A dark theme" },
      });
      await run("message.created", await send(id, "And a dark mode?"));
      messages = await messagesOf(id);
      expect(messages.filter((m) => m.feedbackCard)).toHaveLength(1);

      // The customer confirms the card with the request it made from it, once.
      const post = await call("POST", "/widget/posts", {
        bearer: ada.token,
        body: { title: "PDF export", content: "Export reports as PDF" },
      });
      const confirm = () =>
        call(
          "PUT",
          `/widget/conversations/${id}/messages/${answer.id}/feedback-card`,
          { bearer: ada.token, body: { postId: post.body.id } },
        );
      const confirmed = await confirm();
      expect(confirmed.status).toBe(200);
      expect(confirmed.body.message.feedbackCard).toMatchObject({
        status: "confirmed",
        postId: post.body.id,
      });
      expect((await confirm()).status).toBe(409);

      // Asking for a person hands off: a private note for the team and a notice for the customer.
      agent({ reply: "I will get a teammate.", handoff: "explicit_request" });
      await run(
        "message.created",
        await send(id, "I want to talk to a person"),
      );
      const handoff = (
        await pool.query(
          "SELECT status, handoff_reason FROM quills.assistant_involvements WHERE conversation_id = $1",
          [uuid(id)],
        )
      ).rows;
      expect(handoff).toEqual([
        { status: "handed_off", handoff_reason: "explicit_request" },
      ]);
      const note = (
        await pool.query(
          "SELECT content FROM quills.conversation_messages WHERE conversation_id = $1 AND is_internal",
          [uuid(id)],
        )
      ).rows;
      expect(note[0]?.content).toContain("I want to talk to a person");
      messages = await messagesOf(id);
      expect(
        messages.some(
          (m) =>
            m.content.includes("I want to talk to a person") &&
            m.senderType === "system",
        ),
      ).toBe(false);
      expect(messages.at(-1)).toMatchObject({
        senderType: "system",
        content: "A teammate will reply here.",
      });
      // After a handoff the agent stays out of the conversation.
      const before = provider.requests.length;
      await run("message.created", await send(id, "Hello?"));
      expect(provider.requests.length).toBe(before);

      // A teammate who closes the conversation while the model answers keeps it closed and quiet.
      const taken = await call("POST", "/widget/conversations", {
        bearer: ada.token,
        body: {
          content: "Is SSO on the roadmap?",
          idempotencyKey: contractEnv().id("key"),
        },
      });
      const takenId = taken.body.conversation.id as string;
      agent({ reply: "Not yet." });
      const pending = await answerCustomer(
        contractEnv().a,
        await eventOf("conversation.created", takenId),
      );
      await pool.query(
        "UPDATE quills.conversations SET status = 'closed' WHERE id = $1",
        [uuid(takenId)],
      );
      await withQuillsSystemWorkspace(contractEnv().a, pending);
      expect((await messagesOf(takenId)).some((m) => m.fromAssistant)).toBe(
        false,
      );

      // A conversation the agent answered last and nobody replied to for a day closes.
      const quiet = await call("POST", "/widget/conversations", {
        bearer: ada.token,
        body: {
          content: "Where is billing?",
          idempotencyKey: contractEnv().id("key"),
        },
      });
      const quietId = quiet.body.conversation.id as string;
      agent({ reply: "Billing is under Settings." });
      await run("conversation.created", quietId);
      await pool.query(
        "UPDATE quills.assistant_involvements SET last_assistant_answer_at = now() - interval '25 hours' WHERE conversation_id = $1",
        [uuid(quietId)],
      );
      await runQuillsSweeps(contractEnv().a);
      const closed = (
        await pool.query(
          "SELECT c.status, i.status AS involvement FROM quills.conversations c JOIN quills.assistant_involvements i ON i.conversation_id = c.id WHERE c.id = $1",
          [uuid(quietId)],
        )
      ).rows;
      expect(closed).toEqual([
        { status: "closed", involvement: "resolved_assumed" },
      ]);
    } finally {
      provider.reply();
      await assistant({ agentEnabled: false });
    }

    // With the agent off, a new conversation is left to the team.
    const off = await call("POST", "/widget/conversations", {
      bearer: ada.token,
      body: { content: "Hi", idempotencyKey: contractEnv().id("key") },
    });
    const before = provider.requests.length;
    await run("conversation.created", off.body.conversation.id);
    expect(provider.requests.length).toBe(before);
  });

  it("signs an identified visitor in to the portal through a Kaneo account, with their widget history", async () => {
    // The grants are signed with the instance's AUTH_SECRET, which every deployment sets.
    if (!process.env.AUTH_SECRET)
      vi.stubEnv("AUTH_SECRET", "test-auth-secret-of-at-least-32-characters");
    const a = contractEnv().a;
    const owner = contractEnv().owner;
    const signIn = (body: object) =>
      app.request(`/quills/${a}/settings/portal/sign-in`, {
        method: "PUT",
        headers: { "x-test-user": owner, "content-type": "application/json" },
        body: JSON.stringify(body),
      });
    const portal = async (path: string, user: string) => {
      const res = await app.request(`/quills-public/${a}${path}`, {
        headers: { "x-test-user": user },
      });
      return { status: res.status, body: await res.json() };
    };
    const signed = (query: Record<string, string>) =>
      app.request(
        `/quills-public/signed/portal-sign-in?${new URLSearchParams(query)}`,
      );
    const before = (
      await pool.query(
        "SELECT portal_config FROM quills.settings WHERE workspace_id = $1",
        [a],
      )
    ).rows[0].portal_config as string | null;
    await pool.query(
      "UPDATE quills.settings SET portal_config = $2 WHERE workspace_id = $1",
      [a, JSON.stringify({ ...JSON.parse(before || "{}"), enabled: true })],
    );
    try {
      const ada = await visitor();
      const link = () =>
        call("POST", "/widget/portal-sign-in", {
          bearer: ada.token,
          body: { next: "/my-feedback" },
        });
      // Off by default.
      expect((await link()).status).toBe(403);
      expect(
        (await signIn({ mode: "account", widgetSignIn: true, ssoUrl: null }))
          .status,
      ).toBe(200);
      const started = await call("POST", "/widget/conversations", {
        bearer: ada.token,
        body: {
          content: "Before the portal",
          idempotencyKey: contractEnv().id("key"),
        },
      });
      const issued = await link();
      expect(issued.status).toBe(200);
      const code = new URL(issued.body.url).searchParams.get("code")!;

      // The signed step checks the code once and hands Kaneo's sign-in a grant for this customer.
      const first = await signed({ workspace: a, code });
      expect(first.status).toBe(200);
      const { grant } = await first.json();
      expect(first.headers.get("x-quills-result-location")).toContain(
        "/api/auth/quills/portal-session?grant=",
      );
      const claims = readGrant("session", grant)!;
      const customerId = (
        await pool.query("SELECT user_id FROM quills.principal WHERE id = $1", [
          ada.principal,
        ])
      ).rows[0].user_id as string;
      expect(claims).toMatchObject({ workspaceId: a, next: "/my-feedback" });
      expect(uuid(claims.customerId)).toBe(customerId);
      expect((await (await signed({ workspace: a, code })).json()).grant).toBe(
        "",
      );

      // Kaneo's sign-in (utils/quills-portal-session.ts) creates the account and its link row.
      const userId = contractEnv().id("portal_token_user");
      await pool.query(
        "INSERT INTO public.\"user\" (id, name, email, email_verified, created_at, updated_at) VALUES ($1, 'Ada', $2, false, now(), now())",
        [userId, claims.email],
      );
      await pool.query(
        "INSERT INTO public.account (id, account_id, provider_id, user_id, created_at, updated_at) VALUES ($1, $2, 'quills-portal', $3, now(), now())",
        [contractEnv().id("acct"), `${a}:${claims.customerId}`, userId],
      );
      try {
        // The account's first portal request takes over the widget profile: one history.
        const mine = await portal("/support/conversations", userId);
        expect(mine.status).toBe(200);
        expect(mine.body.items.map((c: { id: string }) => c.id)).toContain(
          started.body.conversation.id,
        );
        const linked = (
          await pool.query(
            "SELECT kaneo_user_id FROM quills.customer_identity WHERE id = $1",
            [customerId],
          )
        ).rows[0].kaneo_user_id;
        expect(linked).toBe(userId);
        // The host app keeps identifying the same person in the widget.
        expect(
          (
            await identify({
              sub: ada.sub,
              email: `${ada.sub}@example.test`,
              exp: exp(),
            })
          ).status,
        ).toBe(200);
        // A private portal lets the host's customer in.
        expect((await portal("/portal/access", userId)).body).toMatchObject({
          granted: true,
          signIn: { mode: "account", ssoUrl: null },
        });

        // SSO mode: the host app's login page sends the person back with a signed token, once.
        expect(
          (
            await signIn({
              mode: "sso",
              widgetSignIn: false,
              ssoUrl: "https://app.example.test/login",
            })
          ).status,
        ).toBe(200);
        expect((await portal("/portal/access", userId)).body.signIn).toEqual({
          mode: "sso",
          ssoUrl: "https://app.example.test/login",
        });
        const grace = contractEnv().id("sso");
        const token = signIdentity(
          {
            sub: grace,
            email: `${grace}@example.test`,
            name: "Grace",
            exp: exp(),
          },
          secret,
        );
        const sso = await signed({ workspace: a, token, next: "/changelog" });
        expect(sso.status).toBe(200);
        expect(readGrant("session", (await sso.json()).grant)).toMatchObject({
          email: `${grace}@example.test`,
          name: "Grace",
          next: "/changelog",
        });
        expect(
          (await (await signed({ workspace: a, token })).json()).grant,
        ).toBe("");
        expect(
          (
            await signed({
              workspace: a,
              token: signIdentity(
                { sub: grace, email: `${grace}@example.test`, exp: exp() },
                "wrong-secret",
              ),
            })
          ).status,
        ).toBe(401);

        // Customer sign-in turned off: the account is a signed-out caller.
        expect(
          (
            await signIn({
              mode: "disabled",
              widgetSignIn: false,
              ssoUrl: null,
            })
          ).status,
        ).toBe(200);
        expect((await portal("/support/conversations", userId)).status).toBe(
          401,
        );
        expect((await link()).status).toBe(403);
      } finally {
        await pool.query(
          "UPDATE quills.customer_identity SET kaneo_user_id = NULL WHERE id = $1",
          [customerId],
        );
        await pool.query("DELETE FROM public.account WHERE user_id = $1", [
          userId,
        ]);
        await pool.query('DELETE FROM public."user" WHERE id = $1', [userId]);
      }
    } finally {
      await pool.query(
        "UPDATE quills.settings SET portal_config = $2 WHERE workspace_id = $1",
        [a, before],
      );
    }
  });

  it("answers a visitor with the away reply while the team is away, once per conversation", async () => {
    const settings = (body: unknown) =>
      app.request(`/quills/${contractEnv().a}/support/away-reply`, {
        method: "PUT",
        headers: {
          "x-test-user": contractEnv().owner,
          "content-type": "application/json",
        },
        body: JSON.stringify(body),
      });
    const message = "We are away and reply in the morning.";
    expect((await settings({ enabled: true, message })).status).toBe(200);
    try {
      const ada = await visitor();
      // No teammate has the inbox open in the test workspace.
      const started = await call("POST", "/widget/conversations", {
        bearer: ada.token,
        body: {
          content: "Anyone there?",
          idempotencyKey: contractEnv().id("key"),
        },
      });
      expect(started.status).toBe(200);
      const id = started.body.conversation.id as string;
      await call("POST", `/widget/conversations/${id}/messages`, {
        bearer: ada.token,
        body: {
          content: "Hello again",
          idempotencyKey: contractEnv().id("key"),
        },
      });
      const messages = (
        await call("GET", `/widget/conversations/${id}/messages`, {
          bearer: ada.token,
        })
      ).body.items as { senderType: string; content: string }[];
      expect(
        messages.filter(
          (m) => m.senderType === "system" && m.content === message,
        ),
      ).toHaveLength(1);
    } finally {
      await settings({ enabled: false, message });
    }
  });

  it("blocks the address of a conversation's sender for 30 days, and lifts it", async () => {
    const ada = await visitor();
    const ip = "203.0.113.7";
    const started = await call("POST", "/widget/conversations", {
      bearer: ada.token,
      ip,
      body: { content: "Spam spam", idempotencyKey: contractEnv().id("key") },
    });
    expect(started.status).toBe(200);
    const id = started.body.conversation.id as string;
    const teammate = async (method: string) => {
      const res = await app.request(
        `/quills/${contractEnv().a}/conversations/${id}/ip-block`,
        { method, headers: { "x-test-user": contractEnv().owner } },
      );
      return { status: res.status, body: (await res.json()) as any };
    };
    expect((await teammate("GET")).body).toEqual({
      available: true,
      blockedUntil: null,
    });
    const blocked = await teammate("PUT");
    expect(blocked.status).toBe(200);
    const days =
      (Date.parse(blocked.body.blockedUntil) - Date.now()) / 86_400_000;
    expect(days).toBeGreaterThan(29.9);
    expect(days).toBeLessThan(30.1);
    const write = (from: string) =>
      call("POST", "/widget/posts", {
        bearer: ada.token,
        ip: from,
        body: { content: `From ${from} ${contractEnv().id("t")}` },
      });
    expect((await write(ip)).status).toBe(403);
    expect(
      (await call("POST", "/widget/anonymous-session", { ip })).status,
    ).toBe(403);
    expect((await write("198.51.100.9")).status).toBe(200);
    // Reads still work, so the widget can show why.
    expect((await call("GET", "/widget/config.json", { ip })).status).toBe(200);
    // The address itself is never stored.
    const stored = await pool.query(
      "SELECT key, value::text AS value FROM quills.kv_store WHERE workspace_id = $1 AND (key LIKE 'ip_block:%' OR key LIKE 'conversation_ip:%')",
      [contractEnv().a],
    );
    expect(JSON.stringify(stored.rows)).not.toContain(ip);
    expect((await teammate("DELETE")).body.blockedUntil).toBe(null);
    expect((await write(ip)).status).toBe(200);
  });

  it("follows the REST conventions: Idempotency-Key, updatedSince and app user IDs", async () => {
    const ada = await visitor();
    const key = contractEnv().id("idem");
    const post = () =>
      app.request(`/quills-public/${contractEnv().a}/widget/posts`, {
        method: "POST",
        headers: {
          authorization: `Bearer ${ada.token}`,
          "content-type": "application/json",
          "idempotency-key": key,
        },
        body: JSON.stringify({ content: "Sync my boards" }),
      });
    const first = (await (await post()).json()) as {
      id: string;
      replayed: boolean;
    };
    const second = (await (await post()).json()) as {
      id: string;
      replayed: boolean;
    };
    expect(second).toMatchObject({ id: first.id, replayed: true });
    expect(first.replayed).toBe(false);

    const teammate = async (path: string, method = "GET") => {
      const res = await app.request(`/quills/${contractEnv().a}${path}`, {
        method,
        headers: { "x-test-user": contractEnv().owner },
      });
      return { status: res.status, body: (await res.json()) as any };
    };
    const future = new Date(Date.now() + 60_000).toISOString();
    const past = new Date(Date.now() - 60_000).toISOString();
    const listed = async (since: string) =>
      (
        await teammate(
          `/posts?limit=100&updatedSince=${encodeURIComponent(since)}`,
        )
      ).body.items.some((item: { id: string }) => item.id === first.id);
    expect(await listed(past)).toBe(true);
    expect(await listed(future)).toBe(false);

    const found = await teammate(
      `/users/by-external-id?externalId=${encodeURIComponent(ada.sub)}`,
    );
    expect(found.status).toBe(200);
    expect(toUuid(found.body.principalId)).toBe(ada.principal);
    expect(
      (await teammate(`/users/by-external-id?externalId=nobody-${key}`)).status,
    ).toBe(404);
    const vote = await teammate(
      `/posts/${feedback.postId}/voters/${found.body.principalId}`,
      "PUT",
    );
    expect(vote.status).toBe(200);
  });

  it("finds requests despite a typo or a partial word, and leaves out minus words", async () => {
    const ada = await visitor();
    const tag = contractEnv()
      .id("s")
      .replace(/[^a-z0-9]/gi, "");
    for (const content of [
      `Quarterly invoices export ${tag}`,
      `Quarterly invoices archive ${tag}`,
    ]) {
      const created = await call("POST", "/widget/posts", {
        bearer: ada.token,
        body: { content },
      });
      expect(created.status).toBe(200);
    }
    const titles = async (search: string) =>
      (
        (
          await call(
            "GET",
            `/widget/posts?limit=50&search=${encodeURIComponent(search)}`,
            { bearer: ada.token },
          )
        ).body.items as { title: string }[]
      )
        .map((item) => item.title)
        .filter((title) => title.includes(tag));
    // A typo in a title word.
    expect(await titles(`quartrely invoices ${tag}`)).toHaveLength(2);
    // The start of a word.
    expect(await titles(`expor ${tag}`)).toEqual([
      `Quarterly invoices export ${tag}`,
    ]);
    // A minus word leaves those requests out.
    expect(await titles(`invoices ${tag} -archive`)).toEqual([
      `Quarterly invoices export ${tag}`,
    ]);
  });

  it("holds spam and sensitive information for review when the team turned the checks on", async () => {
    const setDefault = (body: unknown) =>
      app.request(`/quills/${contractEnv().a}/moderation/default`, {
        method: "PUT",
        headers: {
          "x-test-user": contractEnv().owner,
          "content-type": "application/json",
        },
        body: JSON.stringify(body),
      });
    expect(
      (
        await setDefault({
          requireApproval: "none",
          holdSpam: true,
          holdSensitive: true,
        })
      ).status,
    ).toBe(200);
    try {
      const ada = await visitor();
      const stateOf = async (content: string) => {
        const created = await call("POST", "/widget/posts", {
          bearer: ada.token,
          body: { content },
        });
        expect(created.status).toBe(200);
        return (
          await pool.query(
            "SELECT moderation_state FROM quills.posts WHERE id = $1",
            [uuid(created.body.id)],
          )
        ).rows[0].moderation_state as string;
      };
      const tag = contractEnv().id("m");
      expect(
        await stateOf(
          `BUY NOW CASINO BONUS ${tag} http://a.test http://b.test http://c.test`,
        ),
      ).toBe("pending");
      expect(await stateOf(`My card is 4242 4242 4242 4242 ${tag}`)).toBe(
        "pending",
      );
      expect(await stateOf(`Please add CSV export ${tag}`)).toBe("published");

      // An image is checked by AI after the post commits: a card in a screenshot holds the post.
      const withImage = async (sensitive: boolean) => {
        const created = await call("POST", "/widget/posts", {
          bearer: ada.token,
          body: { content: `Screenshot of the error ${contractEnv().id("i")}` },
        });
        await pool.query(
          "INSERT INTO quills.files (id, workspace_id, storage_key, name, content_type, family, size, sha256, source, uploaded_by_id, post_id, attached_at, preview_status) VALUES (gen_random_uuid(), $1, $2, 'shot.png', 'image/png', 'image', 8, $3, 'customer', $4, $5, now(), 'none')",
          [
            contractEnv().a,
            `quills/file/${contractEnv().id("k")}.png`,
            "0".repeat(64),
            ada.principal,
            uuid(created.body.id),
          ],
        );
        const [event] = (
          await pool.query(
            "SELECT event_id FROM quills.events WHERE workspace_id = $1 AND type = 'post.created' AND entity_id = $2",
            [contractEnv().a, created.body.id],
          )
        ).rows;
        provider.reply(() =>
          chatReply({ sensitive, kinds: sensitive ? ["payment card"] : [] }),
        );
        const loaded = await withQuillsSystemWorkspace(contractEnv().a, (db) =>
          loadEvent(db, event.event_id),
        );
        await withQuillsSystemWorkspace(
          contractEnv().a,
          await checkPostImages(contractEnv().a, loaded!),
        );
        return (
          await pool.query(
            "SELECT moderation_state FROM quills.posts WHERE id = $1",
            [uuid(created.body.id)],
          )
        ).rows[0].moderation_state as string;
      };
      try {
        expect(await withImage(true)).toBe("pending");
        const sent = provider.requests.at(-1)!.body.messages[1].content;
        expect(sent[0].image_url.url).toBe(
          `data:image/png;base64,${Buffer.from("fake-png").toString("base64")}`,
        );
        expect(await withImage(false)).toBe("published");
      } finally {
        provider.reply();
      }
    } finally {
      await setDefault({
        requireApproval: "none",
        holdSpam: false,
        holdSensitive: false,
      });
    }
  });

  it("refuses bad tokens with 403", async () => {
    const sub = contractEnv().id("sub");
    const email = `${sub}@example.test`;
    const refused = [
      await identify({ sub, email, exp: exp() }, `${secret}-wrong`),
      await identify({ sub, email, exp: exp(-60) }),
      await identify({ email, exp: exp() }),
      await identify({ sub, exp: exp() }),
    ];
    expect(refused.map((res) => res.status)).toEqual([403, 403, 403, 403]);
    expect(
      (
        await pool.query(
          "SELECT count(*)::int AS n FROM quills.customer_identity WHERE workspace_id = $1 AND (external_id = $2 OR email = $3)",
          [contractEnv().a, sub, email],
        )
      ).rows[0].n,
    ).toBe(0);
  });

  it("keeps one person's conversations from another person and from anonymous sessions", async () => {
    const ada = await visitor();
    const grace = await visitor();
    const started = await call("POST", "/widget/conversations", {
      bearer: ada.token,
      body: { content: "Private", idempotencyKey: contractEnv().id("key") },
    });
    const id = started.body.conversation.id as string;
    const anonymous = (await call("POST", "/widget/anonymous-session")).body
      .sessionToken as string;
    for (const bearer of [grace.token, anonymous]) {
      expect(
        (await call("GET", `/widget/conversations/${id}`, { bearer })).status,
      ).toBe(404);
      expect(
        (await call("GET", `/widget/conversations/${id}/messages`, { bearer }))
          .status,
      ).toBe(404);
      const list = await call("GET", "/widget/conversations?limit=50", {
        bearer,
      });
      expect(JSON.stringify(list.body)).not.toContain(id);
    }
    // Ada's identified session is not an anonymous session that identify could merge.
    const merged = await call("POST", "/widget/identify", {
      bearer: ada.token,
      body: {
        ssoToken: signIdentity(
          { sub: grace.sub, email: `${grace.sub}@example.test`, exp: exp() },
          secret,
        ),
        previousToken: ada.token,
      },
    });
    expect(merged.status).toBe(200);
    expect(merged.body.mergedPrincipalId).toBeNull();
    expect(
      (
        await pool.query(
          "SELECT visitor_principal_id FROM quills.conversations WHERE id = $1",
          [toUuid(id)],
        )
      ).rows[0].visitor_principal_id,
    ).toBe(ada.principal);
  });

  it("refuses identify for a blocked person", async () => {
    const linus = await visitor();
    await pool.query(
      "UPDATE quills.principal SET blocked_at = now() WHERE id = $1",
      [linus.principal],
    );
    const res = await identify({
      sub: linus.sub,
      email: `${linus.sub}@example.test`,
      exp: exp(),
    });
    expect(res.status).toBe(403);
    expect(res.body.message).toMatch(/blocked/i);
    expect(
      (await call("GET", "/widget/session", { bearer: linus.token })).status,
    ).toBe(403);
  });
});
