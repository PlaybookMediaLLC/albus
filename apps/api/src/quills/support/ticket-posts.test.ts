import { afterAll, beforeAll, describe, expect, it, vi } from "vite-plus/test";
import { and, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { postActivity } from "../../database/quills/schema/activity";
import { auditLog } from "../../database/quills/schema/audit-log";
import { postSubscriptions } from "../../database/quills/schema/notifications";
import { posts, postVotes } from "../../database/quills/schema/posts";
import * as kaneo from "../../database/schema";
import quillsRouter from "../index";
import {
  contractApp,
  contractEnv,
  startContract,
  stopContract,
} from "../framework/contract";
import {
  call,
  removeMembers,
  restrictedMember,
} from "../feedback/taxonomy-harness.fixture";
import { withBoard } from "./seed.fixture";

// A request recorded from a ticket (#73) under a real database.

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
const app = contractApp(quillsRouter);
const request = (ticketId: string, body: object) =>
  call(
    app,
    contractEnv(),
    contractEnv().owner,
    "POST",
    `/tickets/${ticketId}/posts`,
    body,
  );

/** The rows that a request from a ticket writes about one post. */
const stored = (postId: string) =>
  contractEnv().scoped(contractEnv().a, async (db, actor) => ({
    actor: actor.principalId,
    post: (
      await db
        .select({
          author: posts.principalId,
          tracked: posts.trackedByPrincipalId,
        })
        .from(posts)
        .where(eq(posts.id, postId as never))
    )[0],
    votes: await db
      .select({
        principalId: postVotes.principalId,
        source: postVotes.sourceType,
        addedBy: postVotes.addedByPrincipalId,
      })
      .from(postVotes)
      .where(eq(postVotes.postId, postId as never)),
    subscriptions: await db
      .select({
        principalId: postSubscriptions.principalId,
        reason: postSubscriptions.reason,
      })
      .from(postSubscriptions)
      .where(eq(postSubscriptions.postId, postId as never)),
    activity: await db
      .select({ type: postActivity.type, metadata: postActivity.metadata })
      .from(postActivity)
      .where(eq(postActivity.postId, postId as never)),
    audit: await db
      .select({
        type: auditLog.eventType,
        actor: auditLog.actorPrincipalId,
        metadata: auditLog.metadata,
      })
      .from(auditLog)
      .where(
        and(eq(auditLog.targetId, postId), eq(auditLog.targetType, "post")),
      ),
  }));

describe.skipIf(!url)("Recording a ticket's request as feedback", () => {
  beforeAll(async () => {
    pool = new Pool({ connectionString: url, max: 5 });
    await startContract(pool, url!);
  }, 120000);
  afterAll(async () => {
    await removeMembers(contractEnv());
    await stopContract();
  }, 120000);

  it("records a post by the requester, subscribed as its author, with the teammate and the source", async () => {
    const env = contractEnv();
    const ids = await withBoard(env, env.owner);
    const res = await request(ids.a.ticketId, {
      boardId: ids.a.boardId,
      title: "Bulk export",
    });
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ created: true, voted: false });
    const rows = await stored(res.body.postId);
    expect(rows.post).toEqual({
      author: ids.a.customerId,
      tracked: rows.actor,
    });
    expect(rows.votes).toEqual([
      { principalId: ids.a.customerId, source: "ticket", addedBy: rows.actor },
    ]);
    expect(rows.subscriptions).toEqual([
      { principalId: ids.a.customerId, reason: "author" },
    ]);
    expect(rows.activity).toEqual([
      {
        type: "post.created",
        metadata: expect.objectContaining({
          authorPrincipalId: ids.a.customerId,
          source: "ticket",
        }),
      },
    ]);
    expect(rows.audit).toEqual([
      {
        type: "post.created",
        actor: rows.actor,
        metadata: {
          boardId: ids.a.boardId,
          onBehalfOf: ids.a.customerId,
          source: "ticket",
          ticketId: ids.a.ticketId,
        },
      },
    ]);
  });

  it("adds the requester's vote once and does not subscribe a voter", async () => {
    const env = contractEnv();
    const ids = await withBoard(env, env.owner);
    // A post by the teammate, so the requester has no vote or subscription on it yet.
    const own = await call(app, env, env.owner, "POST", "/posts", {
      boardId: ids.a.boardId,
      title: "Audit log export",
    });
    const first = await request(ids.a.ticketId, {
      asUpvoteOfPostId: own.body.id,
    });
    expect(first.body).toMatchObject({
      postId: own.body.id,
      created: false,
      voted: true,
    });
    const again = await request(ids.a.trackedId, {
      asUpvoteOfPostId: own.body.id,
    });
    expect(again.body).toMatchObject({ voted: false });
    const rows = await stored(own.body.id);
    expect(
      rows.votes.filter((v) => v.principalId === ids.a.customerId),
    ).toEqual([
      { principalId: ids.a.customerId, source: "ticket", addedBy: rows.actor },
    ]);
    expect(
      rows.subscriptions.filter((s) => s.principalId === ids.a.customerId),
    ).toEqual([]);
    expect(rows.audit).toContainEqual({
      type: "post.voted",
      actor: rows.actor,
      metadata: {
        principalId: ids.a.customerId,
        onBehalfOf: ids.a.customerId,
        source: "ticket",
        ticketId: ids.a.ticketId,
      },
    });
  });

  it("needs the update action as well as create, and writes nothing without it", async () => {
    const env = contractEnv();
    const ids = await withBoard(env, env.owner);
    const role = env.id("create-only");
    await env.db.insert(kaneo.workspaceRoleTable).values({
      workspaceId: env.a,
      role,
      permission: JSON.stringify({
        workspace: ["read"],
        project: ["read"],
        quills: ["read", "create"],
      }),
      createdAt: new Date(),
    });
    const member = await restrictedMember(env, [], role);
    const count = () =>
      env.scoped(env.a, (db) =>
        db.$count(posts, eq(posts.boardId, ids.a.boardId as never)),
      );
    const before = await count();
    const res = await call(
      app,
      env,
      member,
      "POST",
      `/tickets/${ids.a.ticketId}/posts`,
      {
        boardId: ids.a.boardId,
        title: "Not allowed",
      },
    );
    expect(res.status).toBe(403);
    expect(await count()).toBe(before);
  });

  it("refuses a ticket without a customer requester and another workspace's ticket, and writes nothing", async () => {
    const env = contractEnv();
    const ids = await withBoard(env, env.owner);
    const count = () =>
      env.scoped(env.a, (db) =>
        db.$count(posts, eq(posts.boardId, ids.a.boardId as never)),
      );
    const before = await count();
    const body = { boardId: ids.a.boardId, title: "Nobody asked" };
    expect((await request(ids.a.backOfficeId, body)).status).toBe(409);
    expect((await request(ids.b.ticketId, body)).status).toBe(404);
    expect(await count()).toBe(before);
  });
});
