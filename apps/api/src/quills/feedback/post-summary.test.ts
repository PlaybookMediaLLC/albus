import { afterAll, beforeAll, describe, expect, it, vi } from "vite-plus/test";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import type { PostId } from "@kaneo/ids";
import { aiUsageLog } from "../../database/quills/schema/ai-usage-log";
import { events } from "../../database/quills/schema/events";
import { postComments, posts } from "../../database/quills/schema/posts";
import * as kaneo from "../../database/schema";
import quillsRouter from "../index";
import publicRouter from "../public";
import {
  chatReply,
  provider,
  providerUrl,
} from "../assistant/provider-edge.fixture";
import {
  contractApp,
  contractEnv,
  contractSession,
  startContract,
  stopContract,
} from "../framework/contract";
import { postIn } from "./seeds.fixture";

// The AI summary of a request (RFC 0004, the AI chip) against a real database and the local provider edge.

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
vi.mock("../../ws", () => ({ broadcastToUserAndWait: vi.fn(async () => {}) }));

const url = process.env.QUILLS_TEST_DATABASE_URL;
const app = contractApp(quillsRouter, publicRouter);

const summarize = async (postId: string, workspace = contractEnv().a) => {
  const res = await app.request(
    `/quills/${workspace}/posts/${postId}/summary`,
    {
      method: "POST",
      headers: { "x-test-user": contractEnv().owner },
    },
  );
  return { status: res.status, body: await res.json() };
};

const usage = () =>
  contractEnv().scoped(contractEnv().a, (db) =>
    db
      .select({ step: aiUsageLog.pipelineStep, tokens: aiUsageLog.totalTokens })
      .from(aiUsageLog)
      .where(eq(aiUsageLog.pipelineStep, "post_summary")),
  );
const eventCount = () =>
  contractEnv().scoped(
    contractEnv().a,
    async (db) => (await db.select({ id: events.id }).from(events)).length,
  );

describe.skipIf(!url)("Quills AI request summary", () => {
  beforeAll(async () => {
    pool = new Pool({ connectionString: url, max: 6 });
    await startContract(pool, url!);
  }, 120000);
  afterAll(async () => {
    provider.reply();
    await stopContract();
  });

  it("summarizes a visible post with its comments, logs usage and saves nothing else", async () => {
    const env = contractEnv();
    const post = await postIn(env, env.a, {
      title: "Dark mode",
      content: "The app is too bright at night.",
    });
    await env.scoped(env.a, (db, actor) =>
      db.insert(postComments).values([
        {
          postId: post.postId as PostId,
          principalId: actor.principalId,
          content: "Please add it for the night shift.",
        },
        {
          postId: post.postId as PostId,
          principalId: actor.principalId,
          content: "Two big accounts ask.",
          isTeamMember: true,
          isPrivate: true,
        },
        {
          postId: post.postId as PostId,
          principalId: actor.principalId,
          content: "Removed comment",
          deletedAt: new Date(),
        },
      ]),
    );
    provider.requests.length = 0;
    provider.reply(() => chatReply({ text: "Customers want dark mode." }));
    const before = await eventCount();

    const res = await summarize(post.postId);
    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      postId: post.postId,
      summary: "Customers want dark mode.",
    });
    // The prompt holds the post and its live comments as untrusted data.
    const prompt = JSON.stringify(provider.requests.at(-1)?.body.messages);
    expect(prompt).toContain("<request>");
    expect(prompt).toContain("Dark mode");
    expect(prompt).toContain("Customer: Please add it for the night shift.");
    expect(prompt).toContain("Private note: Two big accounts ask.");
    expect(prompt).not.toContain("Removed comment");
    expect(await usage()).toContainEqual({ step: "post_summary", tokens: 20 });
    expect(await eventCount()).toBe(before);
  });

  it("refuses a foreign, unknown or deleted post before any provider call", async () => {
    const env = contractEnv();
    const foreign = await postIn(env, env.b);
    const deleted = await postIn(env, env.a);
    await env.scoped(env.a, (db) =>
      db
        .update(posts)
        .set({ deletedAt: new Date() })
        .where(eq(posts.id, deleted.postId as PostId)),
    );
    provider.requests.length = 0;
    expect((await summarize(foreign.postId)).status).toBe(404);
    expect((await summarize(deleted.postId)).status).toBe(404);
    expect((await summarize("not-a-post")).status).toBe(400);
    expect(provider.requests).toEqual([]);
  });

  it("answers 409 when AI is off and 502 for a provider failure, without usage rows", async () => {
    const env = contractEnv();
    const post = await postIn(env, env.a);
    const before = (await usage()).length;
    vi.stubEnv("QUILLS_AI_BASE_URL", "");
    try {
      const off = await summarize(post.postId);
      expect(off.status).toBe(409);
      expect(off.body).toMatchObject({ message: "AI is not configured" });
    } finally {
      vi.stubEnv("QUILLS_AI_BASE_URL", providerUrl);
    }
    provider.reply(() => ({ status: 500, json: { error: "secret detail" } }));
    const failed = await summarize(post.postId);
    expect(failed.status).toBe(502);
    expect(JSON.stringify(failed.body)).not.toContain("secret detail");
    expect((await usage()).length).toBe(before);
  });
});
