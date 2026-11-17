import { afterAll, beforeAll, describe, expect, it, vi } from "vite-plus/test";
import { and, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { boards } from "../../database/quills/schema/boards";
import { conversationSummaries } from "../../database/quills/schema/conversation-summary";
import { auditLog } from "../../database/quills/schema/audit-log";
import { events } from "../../database/quills/schema/events";
import { postSubscriptions } from "../../database/quills/schema/notifications";
import { boardProjects } from "../../database/quills/schema/platform-links";
import { posts, postVotes } from "../../database/quills/schema/posts";
import * as kaneo from "../../database/schema";
import { startFeature } from "../feedback/harness.fixture";
import { conversation, customer } from "./conversation-seed.fixture";

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
const url = process.env.QUILLS_TEST_DATABASE_URL;
let world: Awaited<ReturnType<typeof startFeature>>;

/** A conversation of a new customer, and a board that is hidden behind the private project when asked. */
const setup = (hidden = false) =>
  world.scoped(world.a, world.users.owner, async (db, actor) => {
    const visitor = await customer(
      db,
      `unlink-${crypto.randomUUID()}@example.test`,
    );
    const { conversationId } = await conversation(
      db,
      actor.principalId,
      visitor,
    );
    const [board] = await db
      .insert(boards)
      .values({ name: "Ideas", slug: `ideas-${crypto.randomUUID()}` })
      .returning({ id: boards.id });
    if (hidden)
      await db
        .insert(boardProjects)
        .values({ boardId: board!.id, projectId: world.projects.hidden });
    return { conversationId, boardId: board!.id, visitor };
  });

const linked = async (conversationId: string) =>
  (
    await world.request(
      world.users.owner,
      "GET",
      `/conversations/${conversationId}/posts`,
    )
  ).body.items as { postId: string }[];

describe.skipIf(!url)("Unlinking a request from a conversation", () => {
  beforeAll(async () => {
    pool = new Pool({ connectionString: url, max: 10 });
    world = await startFeature(pool, url!, "conversation-posts");
  }, 120000);
  afterAll(() => world?.stop());

  it("removes only the link, once; the post and the visitor's vote stay", async () => {
    const { conversationId, boardId, visitor } = await setup();
    const tracked = await world.request(
      world.users.owner,
      "POST",
      `/conversations/${conversationId}/posts`,
      { boardId, title: "Single sign-on" },
    );
    expect(tracked.status).toBe(200);
    const postId = tracked.body.postId as string;
    expect((await linked(conversationId)).map((p) => p.postId)).toEqual([
      postId,
    ]);

    const path = `/conversations/${conversationId}/posts/${postId}`;
    const first = await world.request(world.users.owner, "DELETE", path);
    expect(first).toEqual({ status: 200, body: { changed: true } });
    expect(await linked(conversationId)).toEqual([]);
    const again = await world.request(world.users.owner, "DELETE", path);
    expect(again).toEqual({ status: 200, body: { changed: false } });

    await world.scoped(world.a, world.users.owner, async (db) => {
      const [post] = await db
        .select({ id: posts.id, deletedAt: posts.deletedAt })
        .from(posts)
        .where(eq(posts.id, postId as never));
      expect(post).toEqual({ id: postId, deletedAt: null });
      const votes = await db
        .select({ id: postVotes.id })
        .from(postVotes)
        .where(
          and(
            eq(postVotes.postId, postId as never),
            eq(postVotes.principalId, visitor as never),
          ),
        );
      expect(votes).toHaveLength(1);
      // One event for the removal; the repeated call records nothing.
      const recorded = await db
        .select({ entityId: events.entityId, payload: events.payload })
        .from(events)
        .where(eq(events.type, "conversation.post_unlinked"));
      expect(recorded.filter((row) => row.entityId === conversationId)).toEqual(
        [{ entityId: conversationId, payload: { postId } }],
      );
    });
  });

  it("subscribes the visitor as an author but not as a voter, and audits the customer and the source (#73)", async () => {
    const { conversationId, boardId, visitor } = await setup();
    const created = await world.request(
      world.users.owner,
      "POST",
      `/conversations/${conversationId}/posts`,
      { boardId, title: "Bulk export" },
    );
    expect(created.status).toBe(200);
    const other = await setup();
    const voted = await world.request(
      world.users.owner,
      "POST",
      `/conversations/${other.conversationId}/posts`,
      { asUpvoteOfPostId: created.body.postId },
    );
    expect(voted.body).toMatchObject({ voted: true, created: false });
    const stored = await world.scoped(
      world.a,
      world.users.owner,
      async (db, actor) => ({
        actor: actor.principalId,
        subscribed: await db
          .select({ principalId: postSubscriptions.principalId })
          .from(postSubscriptions)
          .where(eq(postSubscriptions.postId, created.body.postId)),
        votes: await db
          .select({
            principalId: postVotes.principalId,
            source: postVotes.sourceType,
            addedBy: postVotes.addedByPrincipalId,
          })
          .from(postVotes)
          .where(eq(postVotes.postId, created.body.postId)),
        audit: await db
          .select({ type: auditLog.eventType, metadata: auditLog.metadata })
          .from(auditLog)
          .where(eq(auditLog.targetId, created.body.postId)),
      }),
    );
    expect(stored.subscribed).toEqual([{ principalId: visitor }]);
    expect(stored.votes).toHaveLength(2);
    expect(stored.votes).toEqual(
      expect.arrayContaining([
        { principalId: visitor, source: "conversation", addedBy: stored.actor },
        {
          principalId: other.visitor,
          source: "conversation",
          addedBy: stored.actor,
        },
      ]),
    );
    expect(stored.audit).toEqual(
      expect.arrayContaining([
        {
          type: "post.created",
          metadata: expect.objectContaining({
            onBehalfOf: visitor,
            source: "conversation",
          }),
        },
        {
          type: "post.voted",
          metadata: expect.objectContaining({
            onBehalfOf: other.visitor,
            source: "conversation",
          }),
        },
      ]),
    );
  });

  it("refuses a post on a board the caller cannot see and keeps its link", async () => {
    const { conversationId, boardId } = await setup(true);
    const tracked = await world.request(
      world.users.owner,
      "POST",
      `/conversations/${conversationId}/posts`,
      { boardId, title: "Private roadmap" },
    );
    expect(tracked.status).toBe(200);
    const response = await world.request(
      world.users.member,
      "DELETE",
      `/conversations/${conversationId}/posts/${tracked.body.postId}`,
    );
    expect(response.status).toBe(404);
    expect(await linked(conversationId)).toHaveLength(1);
  });

  it("returns when the summary was last written", async () => {
    const { conversationId, visitor } = await setup();
    const at = new Date("2026-11-01T10:00:00.000Z");
    await world.scoped(world.a, world.users.owner, async (db) => {
      await db.insert(conversationSummaries).values({
        conversationId: conversationId as never,
        visitorPrincipalId: visitor as never,
        summary: "Needs SSO.",
        updatedAt: at,
      });
    });
    const response = await world.request(
      world.users.owner,
      "GET",
      `/conversations/${conversationId}`,
    );
    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      summary: "Needs SSO.",
      summaryUpdatedAt: at.toISOString(),
    });
  });
});
