import { afterAll, beforeAll, describe, expect, it, vi } from "vite-plus/test";
import { toUuid } from "@kaneo/ids";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as kaneo from "../../database/schema";
import {
  contractApp,
  contractEnv,
  contractSession,
  startContract,
  stopContract,
} from "../framework/contract";
import quillsRouter from "../index";
import publicRouter from "../public";
import { scene, type Scene } from "../portal/feedback/seed.fixture";
import { buildExport } from "../transfer/runs/export-files";
import { importPosts, readRecords } from "../transfer/runs/import-posts";

// Board custom fields (issue #71) through the real routes and PostgreSQL: who may change a board's
// fields, the required and type checks on every create path, internal fields kept from customers,
// events and the outbox, a CSV export and import that keeps the values, and workspace isolation.

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
vi.mock("../../utils/get-user-session", () => ({
  getUserSession: (headers: Headers) => contractSession(headers),
}));
const url = process.env.QUILLS_TEST_DATABASE_URL;
const app = contractApp(quillsRouter, publicRouter);
let client = 0;

async function call(
  method: string,
  path: string,
  options: { user?: string; bearer?: string; body?: unknown } = {},
) {
  const res = await app.request(path, {
    method,
    headers: {
      "content-type": "application/json",
      ...(options.user && { "x-test-user": options.user }),
      ...(options.bearer && { authorization: `Bearer ${options.bearer}` }),
      "x-kaneo-client-ip": `198.51.100.${++client % 250}`,
    },
    ...(options.body !== undefined && { body: JSON.stringify(options.body) }),
  });
  return { status: res.status, body: await res.json() };
}

// The internal field's value: no customer response, event or job payload may contain it.
const SECRET = 424242;
const fields = [
  {
    key: "plan",
    label: "Plan",
    type: "select",
    required: true,
    options: ["Free", "Pro"],
  },
  { key: "seats", label: "Seats", type: "number" },
  { key: "mrr", label: "Internal revenue", type: "number", internal: true },
];

describe.skipIf(!url)("Quills board custom fields", () => {
  let s: Scene;
  let env: ReturnType<typeof contractEnv>;
  let member: string;
  let widgetToken: string;
  const teammate = (
    method: string,
    path: string,
    body?: unknown,
    user?: string,
  ) =>
    call(method, `/quills/${env.a}${path}`, { user: user ?? env.owner, body });
  const portal = (method: string, path: string, body?: unknown) =>
    call(method, `/quills-public/${env.a}/portal${path}`, {
      user: env.customerA,
      body,
    });
  const widget = (method: string, path: string, body?: unknown) =>
    call(method, `/quills-public/${env.a}/widget${path}`, {
      bearer: widgetToken,
      body,
    });

  beforeAll(async () => {
    pool = new Pool({ connectionString: url, max: 5 });
    await startContract(pool, url!);
    env = contractEnv();
    s = await scene(env, "portal");
    // A member of A: reads and writes posts, but cannot manage settings.
    member = env.id("member");
    await env.db
      .insert(kaneo.userTable)
      .values({ id: member, name: member, email: `${member}@example.test` });
    await env.db.insert(kaneo.workspaceUserTable).values({
      workspaceId: env.a,
      userId: member,
      role: "member",
      joinedAt: new Date(),
    });
    widgetToken = (await env.widgetVisitor(env.a)).token;
  }, 120000);
  afterAll(async () => {
    await stopContract();
  });

  it("changes a board's fields only with the board manage permission, in the board's own workspace", async () => {
    const path = `/boards/${s.a.boardId}/settings`;
    const saved = await teammate("PATCH", path, { customFields: fields });
    expect(saved.status).toBe(200);
    expect(saved.body.customFields.map((f: { key: string }) => f.key)).toEqual([
      "plan",
      "seats",
      "mrr",
    ]);
    expect((await teammate("GET", path)).body.customFields[2]).toMatchObject({
      key: "mrr",
      internal: true,
    });
    // A member reads them but cannot change them.
    expect((await teammate("GET", path, undefined, member)).status).toBe(200);
    expect(
      (await teammate("PATCH", path, { customFields: [] }, member)).status,
    ).toBe(403);
    // B's owner and B's board: no access, and both answer like a missing workspace or board.
    expect(
      (await teammate("PATCH", path, { customFields: [] }, env.outsider))
        .status,
    ).toBe(404);
    expect(
      (
        await teammate("PATCH", `/boards/${s.b.boardId}/settings`, {
          customFields: [],
        })
      ).status,
    ).toBe(404);
    expect(
      (
        await call("PATCH", `/quills/${env.b}/boards/${s.a.boardId}/settings`, {
          user: env.outsider,
          body: { customFields: [] },
        })
      ).status,
    ).toBe(404);
    // Bad definitions are refused.
    expect(
      (
        await teammate("PATCH", path, {
          customFields: [{ key: "plan", label: "Plan", type: "select" }],
        })
      ).status,
    ).toBe(400);
    // Nothing above changed A's fields.
    expect((await teammate("GET", path)).body.customFields).toHaveLength(3);
  });

  it("shows customers only the public fields and requires them in the portal and the widget", async () => {
    for (const read of [
      () => portal("GET", "/boards"),
      () => widget("GET", "/boards"),
    ]) {
      const res = await read();
      expect(res.status).toBe(200);
      const board = res.body.items.find(
        (b: { id: string }) => b.id === s.a.boardId,
      );
      expect(board.fields.map((f: { key: string }) => f.key)).toEqual([
        "plan",
        "seats",
      ]);
      expect(JSON.stringify(res.body)).not.toContain("Internal revenue");
      expect(JSON.stringify(res.body)).not.toContain("internal");
    }
    for (const create of [
      (body: unknown) => portal("POST", "/posts", body),
      (body: unknown) => widget("POST", "/posts", body),
    ]) {
      const post = (customFields?: unknown) =>
        create({
          boardId: s.a.boardId,
          title: "Fields",
          content: "x",
          customFields,
        });
      expect((await post()).body.message).toBe('Field "plan" is required');
      expect((await post({ plan: "Gold" })).status).toBe(400);
      expect((await post({ plan: "Pro", seats: "3" })).status).toBe(400);
      // A customer cannot set, or learn of, an internal field.
      const internal = await post({ plan: "Pro", mrr: SECRET });
      expect(internal.status).toBe(400);
      expect(internal.body.message).toBe('Unknown field "mrr"');
      expect((await post({ plan: "Pro", seats: 3 })).status).toBe(200);
    }
  });

  it("keeps internal values out of customer responses, events and jobs, and shows them to teammates", async () => {
    const created = await portal("POST", "/posts", {
      boardId: s.a.boardId,
      title: "Secret fields",
      content: "x",
      customFields: { plan: "Pro", seats: 5 },
    });
    expect(created.status).toBe(200);
    const postId = created.body.id;
    // A teammate cannot clear a required field, and sets the internal one.
    const cleared = await teammate("PATCH", `/posts/${postId}`, {
      customFields: { plan: null },
    });
    expect(cleared.body).toMatchObject({ message: 'Field "plan" is required' });
    expect(cleared.status).toBe(400);
    const updated = await teammate("PATCH", `/posts/${postId}`, {
      customFields: { mrr: SECRET },
    });
    expect(updated.status).toBe(200);
    expect(updated.body.customFields).toEqual([
      { key: "plan", value: "Pro", values: null },
      { key: "seats", value: 5, values: null },
      { key: "mrr", value: SECRET, values: null },
    ]);
    expect(
      (await teammate("GET", `/posts/${postId}`)).body.customFields,
    ).toEqual(updated.body.customFields);
    for (const read of [
      () => portal("GET", `/posts/${postId}`),
      () => widget("GET", `/posts/${postId}`),
      () => portal("GET", "/posts?limit=50"),
    ]) {
      const res = await read();
      expect(res.status).toBe(200);
      expect(JSON.stringify(res.body)).not.toContain(String(SECRET));
    }
    expect((await portal("GET", `/posts/${postId}`)).body.customFields).toEqual(
      [
        { key: "plan", label: "Plan", value: "Pro", values: null },
        { key: "seats", label: "Seats", value: 5, values: null },
      ],
    );
    const leaked = await pool.query(
      `SELECT (SELECT count(*) FROM quills.events WHERE workspace_id=$1 AND payload::text LIKE $2)
            + (SELECT count(*) FROM quills.job_queue WHERE workspace_id=$1 AND payload::text LIKE $2) AS n`,
      [env.a, `%${SECRET}%`],
    );
    expect(Number(leaked.rows[0].n)).toBe(0);
  });

  it("checks the teammate create path, internal required fields included", async () => {
    await teammate("PATCH", `/boards/${s.a.boardId}/settings`, {
      customFields: [
        ...fields.slice(0, 2),
        { ...fields[2], required: true },
        {
          key: "areas",
          label: "Areas",
          type: "multi_select",
          options: ["API", "UI"],
        },
      ],
    });
    const create = (customFields?: unknown) =>
      teammate("POST", "/posts", {
        boardId: s.a.boardId,
        title: "Team",
        customFields,
      });
    expect((await create({ plan: "Pro" })).body.message).toBe(
      'Field "mrr" is required',
    );
    expect((await create({ plan: "Pro", mrr: "lots" })).status).toBe(400);
    const ok = await create({ plan: "Free", mrr: 7, areas: ["UI", "API"] });
    expect(ok.status).toBe(200);
    expect(ok.body.customFields).toEqual([
      { key: "plan", value: "Free", values: null },
      { key: "mrr", value: 7, values: null },
      { key: "areas", value: null, values: ["UI", "API"] },
    ]);
    // Customers still need only the public fields.
    expect(
      (
        await portal("POST", "/posts", {
          boardId: s.a.boardId,
          title: "Customer",
          content: "x",
          customFields: { plan: "Free" },
        })
      ).status,
    ).toBe(200);
    await teammate("PATCH", `/boards/${s.a.boardId}/settings`, {
      customFields: fields,
    });
  });

  it("keeps every value through a CSV export and import", async () => {
    const title = `CSV round trip ${env.id("csv")}`;
    const created = await teammate("POST", "/posts", {
      boardId: s.a.boardId,
      title,
      customFields: { plan: "Pro", seats: 12, mrr: SECRET },
    });
    expect(created.status).toBe(200);
    const imported = await env.scoped(env.a, async (db, actor) => {
      const built = await buildExport(db, "posts", []);
      if ("error" in built) throw new Error(built.error);
      const read = readRecords(built.csv);
      if ("error" in read) throw new Error(read.error);
      const records = read.records.filter((r) => r.title === title);
      expect(records).toHaveLength(1);
      expect(JSON.parse(records[0]!.custom_fields!)).toEqual({
        plan: "Pro",
        seats: 12,
        mrr: SECRET,
      });
      const result = await importPosts(db, {
        records: records.map((r) => ({
          ...r,
          author_email: "",
          author_name: "",
        })),
        boardId: s.a.boardId as never,
        projects: [],
        initiator: actor.principalId as never,
        teammateEmails: new Set(),
      });
      expect(result.errors).toEqual([]);
      expect(result.totals.created).toBe(1);
      return result;
    });
    expect(imported.totals.created).toBe(1);
    const { rows } = await pool.query(
      "SELECT custom_field_values FROM quills.posts WHERE workspace_id=$1 AND title=$2 ORDER BY created_at",
      [env.a, title],
    );
    expect(rows.map((r) => r.custom_field_values)).toEqual([
      { plan: "Pro", seats: 12, mrr: SECRET },
      { plan: "Pro", seats: 12, mrr: SECRET },
    ]);
    // An import checks the values like the API does.
    await env.scoped(env.a, async (db, actor) => {
      const result = await importPosts(db, {
        records: [
          { title: "Bad", content: "", custom_fields: '{"plan":"Gold"}' },
        ],
        boardId: s.a.boardId as never,
        projects: [],
        initiator: actor.principalId as never,
        teammateEmails: new Set(),
      });
      expect(result.errors[0]).toMatchObject({ field: "custom_fields" });
      expect(result.totals.created).toBe(0);
    });
  });

  it("never applies a field of another workspace", async () => {
    const other = await call(
      "PATCH",
      `/quills/${env.b}/boards/${s.b.boardId}/settings`,
      {
        user: env.outsider,
        body: {
          customFields: [
            {
              key: "plan",
              label: "Plan",
              type: "select",
              required: true,
              options: ["Gold"],
            },
            { key: "region", label: "Region", type: "text" },
          ],
        },
      },
    );
    expect(other.status).toBe(200);
    // B's option and B's field do not exist on A's board.
    const post = (customFields: unknown) =>
      portal("POST", "/posts", {
        boardId: s.a.boardId,
        title: "X",
        content: "x",
        customFields,
      });
    expect((await post({ plan: "Gold" })).status).toBe(400);
    expect((await post({ plan: "Pro", region: "EU" })).body.message).toBe(
      'Unknown field "region"',
    );
    // A's board still has A's fields, and B's portal never lists A's board.
    const [{ settings }] = (
      await pool.query("SELECT settings FROM quills.boards WHERE id=$1", [
        toUuid(s.a.boardId as never),
      ])
    ).rows;
    expect(settings.customFields.map((f: { key: string }) => f.key)).toEqual([
      "plan",
      "seats",
      "mrr",
    ]);
  });
});
