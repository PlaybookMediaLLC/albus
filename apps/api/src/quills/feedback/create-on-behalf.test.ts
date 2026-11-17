import { afterAll, beforeAll, describe, expect, it, vi } from "vite-plus/test";
import { and, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import type { TypeId } from "@kaneo/ids";
import { postActivity } from "../../database/quills/schema/activity";
import { auditLog } from "../../database/quills/schema/audit-log";
import { principal } from "../../database/quills/schema/auth";
import { boards } from "../../database/quills/schema/boards";
import { postSubscriptions } from "../../database/quills/schema/notifications";
import { posts, postVotes } from "../../database/quills/schema/posts";
import * as kaneo from "../../database/schema";
import { apiRouter, type BaseVariables } from "../../openapi";
import { contractApp } from "../framework/contract";
import { buildQuillsRoute } from "../framework/define-route";
import { registry } from "../framework/registry";
import { startFeature } from "./harness.fixture";

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
let boardId: TypeId<"board">;

/** A person of a workspace, as the portal or a signal creates one. */
const person = (workspaceId: string, type: "user" | "service" = "user") =>
  world.scoped(
    workspaceId,
    workspaceId === world.b ? world.users.outsider : world.users.owner,
    async (db) => {
      const [row] = await db
        .insert(principal)
        .values({
          type,
          role: "user",
          displayName: "Grace",
          createdAt: new Date(),
        })
        .returning({ id: principal.id });
      return row!.id;
    },
  );
const create = (user: string, authorPrincipalId?: string) =>
  world.request(user, "POST", "/posts", {
    boardId,
    title: "On behalf",
    ...(authorPrincipalId && { authorPrincipalId }),
  });
const postCount = () =>
  world.scoped(world.a, world.users.owner, async (db) =>
    db
      .select({ id: posts.id })
      .from(posts)
      .where(eq(posts.boardId, boardId))
      .then((rows) => rows.length),
  );

const proxyVote = (postId: string, voter: string, user = world.users.owner) =>
  world.request(user, "PUT", `/posts/${postId}/voters/${voter}?source=email`);

/** What the database holds about one person on one post (#73). */
const record = (postId: string, person: string) =>
  world.scoped(world.a, world.users.owner, async (db, actor) => ({
    actor: actor.principalId,
    votes: await db
      .select({
        addedBy: postVotes.addedByPrincipalId,
        source: postVotes.sourceType,
      })
      .from(postVotes)
      .where(
        and(
          eq(postVotes.postId, postId as never),
          eq(postVotes.principalId, person as never),
        ),
      ),
    subscriptions: await db
      .select({ reason: postSubscriptions.reason })
      .from(postSubscriptions)
      .where(
        and(
          eq(postSubscriptions.postId, postId as never),
          eq(postSubscriptions.principalId, person as never),
        ),
      ),
    activity: await db
      .select({
        type: postActivity.type,
        principalId: postActivity.principalId,
        metadata: postActivity.metadata,
      })
      .from(postActivity)
      .where(eq(postActivity.postId, postId as never)),
    audit: await db
      .select({
        type: auditLog.eventType,
        actor: auditLog.actorPrincipalId,
        metadata: auditLog.metadata,
      })
      .from(auditLog)
      .where(eq(auditLog.targetId, postId)),
  }));

describe.skipIf(!url)("Create a post on behalf of a person", () => {
  beforeAll(async () => {
    pool = new Pool({ connectionString: url, max: 5 });
    world = await startFeature(pool, url!, "behalf");
    boardId = await world.scoped(world.a, world.users.owner, async (db) => {
      const [board] = await db
        .insert(boards)
        .values({ name: "Behalf", slug: `behalf-${Date.now()}` })
        .returning({ id: boards.id });
      return board!.id;
    });
  }, 120000);
  afterAll(() => world?.stop());

  it("makes the person the author, first voter and subscriber, tracked by the teammate", async () => {
    const customer = await person(world.a);
    const res = await create(world.users.owner, customer);
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ principalId: customer, voteCount: 1 });
    const stored = await world.scoped(
      world.a,
      world.users.owner,
      async (db, actor) => {
        const [post] = await db
          .select({ tracked: posts.trackedByPrincipalId })
          .from(posts)
          .where(eq(posts.id, res.body.id));
        const votes = await db
          .select({ principalId: postVotes.principalId })
          .from(postVotes)
          .where(eq(postVotes.postId, res.body.id));
        const subscribers = await db
          .select({ principalId: postSubscriptions.principalId })
          .from(postSubscriptions)
          .where(
            and(
              eq(postSubscriptions.postId, res.body.id),
              eq(postSubscriptions.reason, "author"),
            ),
          );
        return {
          tracked: post!.tracked,
          actor: actor.principalId,
          votes,
          subscribers,
        };
      },
    );
    expect(stored.tracked).toBe(stored.actor);
    expect(stored.votes).toEqual([{ principalId: customer }]);
    expect(stored.subscribers).toEqual([{ principalId: customer }]);
  });

  it("records the teammate, the person and the source in the history, the vote and the audit log", async () => {
    const customer = await person(world.a);
    const res = await world.request(world.users.owner, "POST", "/posts", {
      boardId,
      title: "Heard on a call",
      authorPrincipalId: customer,
      source: "call",
    });
    expect(res.status).toBe(200);
    const stored = await record(res.body.id, customer);
    expect(stored.votes).toEqual([{ addedBy: stored.actor, source: "call" }]);
    expect(stored.activity).toEqual([
      {
        type: "post.created",
        principalId: stored.actor,
        metadata: {
          boardName: "Behalf",
          authorPrincipalId: customer,
          authorName: "Grace",
          source: "call",
        },
      },
    ]);
    expect(stored.audit).toEqual([
      {
        type: "post.created",
        actor: stored.actor,
        metadata: { boardId, onBehalfOf: customer, source: "call" },
      },
    ]);
  });

  it("counts a person once however the vote is added, and does not subscribe a voter", async () => {
    const customer = await person(world.a);
    const created = await create(world.users.owner, customer);
    const again = await proxyVote(created.body.id, customer);
    expect(again.status).toBe(200);
    expect(again.body).toMatchObject({ changed: false, voteCount: 1 });

    const other = await create(world.users.owner);
    const first = await proxyVote(other.body.id, customer);
    expect(first.body).toMatchObject({ changed: true, voteCount: 2 });
    const second = await proxyVote(other.body.id, customer);
    expect(second.body).toMatchObject({ changed: false, voteCount: 2 });

    const stored = await record(other.body.id, customer);
    expect(stored.votes).toEqual([{ addedBy: stored.actor, source: "email" }]);
    expect(stored.subscriptions).toEqual([]);
    expect(stored.activity).toContainEqual({
      type: "vote.proxy",
      principalId: stored.actor,
      metadata: {
        voterPrincipalId: customer,
        voterName: "Grace",
        source: "email",
      },
    });
    expect(stored.audit).toContainEqual({
      type: "post.voted",
      actor: stored.actor,
      metadata: { principalId: customer, source: "email" },
    });
    // The voters list shows who added the vote and where they heard it.
    const voters = await world.request(
      world.users.owner,
      "GET",
      `/posts/${other.body.id}/voters`,
    );
    expect(voters.body.items).toContainEqual(
      expect.objectContaining({
        principalId: customer,
        addedByPrincipalId: stored.actor,
        addedByName: world.users.owner,
        sourceType: "email",
      }),
    );
  });

  it("refuses a vote for a person of another workspace, a service principal, or without the update action", async () => {
    const target = await create(world.users.owner);
    const foreign = await person(world.b);
    const service = await person(world.a, "service");
    expect((await proxyVote(target.body.id, foreign)).status).toBe(404);
    expect((await proxyVote(target.body.id, service)).status).toBe(404);
    const customer = await person(world.a);
    const [member] = await world.db
      .select({ role: kaneo.workspaceUserTable.role })
      .from(kaneo.workspaceUserTable)
      .where(
        and(
          eq(kaneo.workspaceUserTable.workspaceId, world.a),
          eq(kaneo.workspaceUserTable.userId, world.users.member),
        ),
      );
    const role = and(
      eq(kaneo.workspaceRoleTable.workspaceId, world.a),
      eq(kaneo.workspaceRoleTable.role, member!.role),
    );
    const permission = (quills: string[]) =>
      world.db
        .update(kaneo.workspaceRoleTable)
        .set({
          permission: JSON.stringify({
            workspace: ["read"],
            project: ["read"],
            quills,
          }),
        })
        .where(role);
    await permission(["read", "create"]);
    try {
      expect(
        (await proxyVote(target.body.id, customer, world.users.member)).status,
      ).toBe(403);
    } finally {
      await permission([
        "read",
        "create",
        "update",
        "delete",
        "manage_settings",
      ]);
    }
    const stored = await record(target.body.id, customer);
    expect(stored.votes).toEqual([]);
    expect((await record(target.body.id, foreign)).votes).toEqual([]);
  });

  it("rolls back the vote, its history and its audit row when the request fails after the write", async () => {
    const target = await create(world.users.owner);
    const customer = await person(world.a);
    const declared = [...registry.keys()].find(
      (d) => d.operationId === "addQuillsPostProxyVote",
    )!;
    const failing = contractApp(
      apiRouter<BaseVariables & { workspaceId: string }>().openapi(
        ...buildQuillsRoute({
          ...declared,
          handler: async (input) => {
            await declared.handler(input);
            throw new Error("Injected failure after the vote");
          },
        }),
      ),
    );
    const res = await failing.request(
      `/quills/${world.a}/posts/${target.body.id}/voters/${customer}?source=call`,
      { method: "PUT", headers: { "x-test-user": world.users.owner } },
    );
    expect(res.status).toBe(500);
    const stored = await record(target.body.id, customer);
    expect(stored.votes).toEqual([]);
    expect(stored.activity.filter((a) => a.type === "vote.proxy")).toEqual([]);
    expect(stored.audit.filter((a) => a.type === "post.voted")).toEqual([]);
  });

  it("keeps the caller as the author without the field or with the caller's own ID", async () => {
    const own = await create(world.users.owner);
    expect(own.status).toBe(200);
    const again = await create(world.users.owner, own.body.principalId);
    expect(again.status).toBe(200);
    expect(again.body.principalId).toBe(own.body.principalId);
  });

  it("refuses a person of another workspace or a service principal and writes nothing", async () => {
    const foreign = await person(world.b);
    const service = await person(world.a, "service");
    const before = await postCount();
    expect((await create(world.users.owner, foreign)).status).toBe(404);
    expect((await create(world.users.owner, service)).status).toBe(404);
    expect(await postCount()).toBe(before);
  });

  it("needs the update action to post on behalf of a person, but not for an own post", async () => {
    const customer = await person(world.a);
    const [member] = await world.db
      .select({ role: kaneo.workspaceUserTable.role })
      .from(kaneo.workspaceUserTable)
      .where(
        and(
          eq(kaneo.workspaceUserTable.workspaceId, world.a),
          eq(kaneo.workspaceUserTable.userId, world.users.member),
        ),
      );
    const role = and(
      eq(kaneo.workspaceRoleTable.workspaceId, world.a),
      eq(kaneo.workspaceRoleTable.role, member!.role),
    );
    const permission = (quills: string[]) =>
      world.db
        .update(kaneo.workspaceRoleTable)
        .set({
          permission: JSON.stringify({
            workspace: ["read"],
            project: ["read"],
            quills,
          }),
        })
        .where(role);
    await permission(["read", "create"]);
    try {
      const before = await postCount();
      expect((await create(world.users.member, customer)).status).toBe(403);
      expect(await postCount()).toBe(before);
      expect((await create(world.users.member)).status).toBe(200);
    } finally {
      await permission([
        "read",
        "create",
        "update",
        "delete",
        "manage_settings",
      ]);
    }
  });
});
