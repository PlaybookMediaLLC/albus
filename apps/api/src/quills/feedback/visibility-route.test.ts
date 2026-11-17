import { afterAll, beforeAll, describe, expect, it, vi } from "vite-plus/test";
import { and, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import type { PostId } from "@kaneo/ids";
import * as kaneo from "../../database/schema";
import { events } from "../../database/quills/schema/events";
import { posts } from "../../database/quills/schema/posts";
import quillsRouter from "../index";
import publicRouter from "../public";
import {
  contractApp,
  contractEnv,
  contractSession,
  startContract,
  stopContract,
} from "../framework/contract";
import { scene } from "../portal/feedback/seed.fixture";

// D2 of the Requests parity plan: "Hidden from board" is the archived moderation state. The
// portal leaves the post out; the team inbox keeps it.

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

/** A teammate request as the owner of A, or an anonymous portal request. */
async function call(
  path: string,
  options: { teammate?: boolean; method?: string; body?: unknown } = {},
) {
  const env = contractEnv();
  const res = await app.request(
    `/${options.teammate ? "quills" : "quills-public"}/${env.a}${path}`,
    {
      method: options.method ?? "GET",
      headers: {
        ...(options.teammate && { "x-test-user": env.owner }),
        ...(options.body !== undefined && {
          "content-type": "application/json",
        }),
        // A fresh client per request keeps these checks under the rate limits.
        "x-kaneo-client-ip": `203.0.113.${++client % 250}`,
      },
      body:
        options.body === undefined ? undefined : JSON.stringify(options.body),
    },
  );
  return { status: res.status, body: (await res.json()) as any };
}
const setVisible = (postId: string, visible: boolean) =>
  call(`/posts/${postId}/visibility`, {
    teammate: true,
    method: "PUT",
    body: { visible },
  });

describe.skipIf(!url)("Quills post visibility", () => {
  beforeAll(async () => {
    pool = new Pool({ connectionString: url, max: 5 });
    await startContract(pool, url!);
  }, 120000);
  afterAll(() => stopContract());

  it("hides a post from the portal, keeps it in the team inbox, and shows it again", async () => {
    const env = contractEnv();
    const { a } = await scene(env, "portal");
    expect((await call(`/portal/posts/${a.postId}`)).status).toBe(200);

    const hidden = await setVisible(a.postId, false);
    expect(hidden).toEqual({
      status: 200,
      body: { id: a.postId, moderationState: "archived" },
    });
    expect((await call(`/portal/posts/${a.postId}`)).status).toBe(404);
    const list = await call(`/portal/posts?boardId=${a.boardId}`);
    expect(
      list.body.items.map((post: { id: string }) => post.id),
    ).not.toContain(a.postId);
    const inbox = await call(`/posts?boardIds=${a.boardId}`, {
      teammate: true,
    });
    expect(inbox.body.items.map((post: { id: string }) => post.id)).toContain(
      a.postId,
    );
    const outbox = await env.scoped(env.a, (db) =>
      db
        .select({ type: events.type, payload: events.payload })
        .from(events)
        .where(
          and(eq(events.entityId, a.postId), eq(events.type, "post.updated")),
        ),
    );
    expect(outbox).toHaveLength(1);

    expect((await setVisible(a.postId, true)).body.moderationState).toBe(
      "published",
    );
    expect((await call(`/portal/posts/${a.postId}`)).status).toBe(200);
  });

  it("refuses a post that waits for review", async () => {
    const env = contractEnv();
    const { a } = await scene(env, "portal");
    await env.scoped(env.a, (db) =>
      db
        .update(posts)
        .set({ moderationState: "pending" })
        .where(eq(posts.id, a.postId as PostId)),
    );
    expect((await setVisible(a.postId, false)).status).toBe(409);
  });

  it("returns the caller's principal, which removes the caller's own vote", async () => {
    const env = contractEnv();
    const { a } = await scene(env, "portal");
    const read = () => call(`/posts/${a.postId}`, { teammate: true });
    expect(
      (await call(`/posts/${a.postId}/vote`, { teammate: true, method: "PUT" }))
        .status,
    ).toBe(200);
    const voted = await read();
    expect(voted.body.hasVoted).toBe(true);
    expect(voted.body).toHaveProperty("authorAvatarUrl");
    const removed = await call(
      `/posts/${a.postId}/voters/${voted.body.viewerPrincipalId}`,
      { teammate: true, method: "DELETE" },
    );
    expect(removed.body.changed).toBe(true);
    expect((await read()).body.hasVoted).toBe(false);
  });
});
