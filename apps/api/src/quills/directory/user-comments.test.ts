import { afterAll, beforeAll, describe, expect, it, vi } from "vite-plus/test";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import type { TypeId } from "@kaneo/ids";
import { principal, user } from "../../database/quills/schema/auth";
import { boards } from "../../database/quills/schema/boards";
import { boardProjects } from "../../database/quills/schema/platform-links";
import {
  postCommentReactions,
  postComments,
  posts,
} from "../../database/quills/schema/posts";
import * as kaneo from "../../database/schema";
import { startFeature } from "../feedback/harness.fixture";

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
type Post = TypeId<"post">;
type Comment = TypeId<"post_comment">;
type Principal = TypeId<"principal">;
// Customer C writes on a plain board and on a board that only the private project links.
// The member cannot open that project. D is another customer, T a test customer.
let ids: Record<
  "own" | "hidden" | "other" | "deleted" | "merged" | "test",
  Post
> &
  Record<
    "onOther" | "onHidden" | "removed" | "onDeleted" | "onTest" | "latest",
    Comment
  > &
  Record<"c" | "d" | "tester" | "owner", Principal>;

describe.skipIf(!url)("Customer posts and comments for the member page", () => {
  beforeAll(async () => {
    pool = new Pool({ connectionString: url, max: 5 });
    world = await startFeature(pool, url!, "usercomments");
    ids = await world.scoped(world.a, world.users.owner, async (db, actor) => {
      const person = async (name: string, test = false) => {
        const [identity] = await db
          .insert(user)
          .values({ name, email: `${name}-${Date.now()}@example.test` })
          .returning({ id: user.id });
        const [row] = await db
          .insert(principal)
          .values({
            userId: identity!.id,
            role: "user",
            type: "user",
            displayName: name,
            createdAt: new Date(),
            ...(test && { testOwnerPrincipalId: actor.principalId }),
          })
          .returning({ id: principal.id });
        return row!.id;
      };
      const c = await person("c");
      const d = await person("d");
      const tester = await person("tester", true);
      const [plain, hiddenBoard] = await db
        .insert(boards)
        .values([
          { name: "Plain", slug: `plain-${Date.now()}` },
          { name: "Hidden", slug: `hidden-${Date.now()}` },
        ])
        .returning({ id: boards.id });
      await db
        .insert(boardProjects)
        .values({ boardId: hiddenBoard!.id, projectId: world.projects.hidden });
      const post = async (principalId: Principal, extra = {}) =>
        (
          await db
            .insert(posts)
            .values({
              title: `Post ${principalId}`,
              content: "Body",
              boardId: plain!.id,
              principalId,
              ...extra,
            })
            .returning({ id: posts.id })
        )[0]!.id;
      const own = await post(c);
      const hidden = await post(c, { boardId: hiddenBoard!.id });
      const other = await post(d);
      const deleted = await post(c, { deletedAt: new Date() });
      const merged = await post(c, { canonicalPostId: own });
      const test = await post(tester);
      let minute = 0;
      const comment = async (postId: Post, extra = {}) =>
        (
          await db
            .insert(postComments)
            .values({
              postId,
              principalId: c,
              content: "**Bold** reply",
              createdAt: new Date(Date.UTC(2026, 0, 1, 0, minute++)),
              ...extra,
            })
            .returning({ id: postComments.id })
        )[0]!.id;
      const onOther = await comment(other);
      const onHidden = await comment(hidden);
      const removed = await comment(other, { deletedAt: new Date() });
      const onDeleted = await comment(deleted);
      const onTest = await comment(test);
      const latest = await comment(own);
      await db.insert(postCommentReactions).values([
        { commentId: onOther, principalId: d, emoji: "👍" },
        { commentId: onOther, principalId: tester, emoji: "👍" },
      ]);
      return {
        ...{ own, hidden, other, deleted, merged, test },
        ...{ onOther, onHidden, removed, onDeleted, onTest, latest },
        ...{ c, d, tester, owner: actor.principalId },
      };
    });
  }, 120000);
  afterAll(() => world?.stop());

  const get = (user: string, path: string) => world.request(user, "GET", path);
  const itemIds = async (user: string, path: string) =>
    ((await get(user, path)).body.items as { id: string }[]).map(
      (item) => item.id,
    );

  it("lists only the author's visible posts", async () => {
    const path = `/posts?limit=100&authorPrincipalId=${ids.c}`;
    expect(await itemIds(world.users.owner, path)).toEqual(
      expect.arrayContaining([ids.own, ids.hidden]),
    );
    expect(await itemIds(world.users.owner, path)).toHaveLength(2);
    // The member cannot open the private project, so its board's post stays out.
    expect(await itemIds(world.users.member, path)).toEqual([ids.own]);
    expect(
      await itemIds(
        world.users.owner,
        `/posts?limit=100&authorPrincipalId=${ids.tester}`,
      ),
    ).toEqual([]);
  });

  it("lists the visible comments newest first, with reactions of real customers", async () => {
    const owner = await get(world.users.owner, `/users/${ids.c}/comments`);
    expect(owner.status).toBe(200);
    expect(owner.body.items.map((item: { id: string }) => item.id)).toEqual([
      ids.latest,
      ids.onHidden,
      ids.onOther,
    ]);
    expect(owner.body.items[2]).toMatchObject({
      postId: ids.other,
      postTitle: `Post ${ids.d}`,
      content: "**Bold** reply",
      reactionCount: 1,
    });
    expect(owner.body).toMatchObject({ hasMore: false, nextCursor: null });
    expect(
      await itemIds(world.users.member, `/users/${ids.c}/comments`),
    ).toEqual([ids.latest, ids.onOther]);
  });

  it("pages with a cursor and refuses a cursor outside the list", async () => {
    const first = await get(
      world.users.owner,
      `/users/${ids.c}/comments?limit=2`,
    );
    expect(first.body).toMatchObject({
      hasMore: true,
      nextCursor: ids.onHidden,
    });
    expect(
      await itemIds(
        world.users.owner,
        `/users/${ids.c}/comments?limit=2&cursor=${ids.onHidden}`,
      ),
    ).toEqual([ids.onOther]);
    for (const cursor of [ids.onHidden, ids.removed, ids.onDeleted, ids.onTest])
      expect(
        (
          await get(
            world.users.member,
            `/users/${ids.c}/comments?cursor=${cursor}`,
          )
        ).status,
        cursor,
      ).toBe(404);
  });

  it("is 404 for a teammate, a test customer and another workspace's person", async () => {
    for (const principalId of [ids.owner, ids.tester])
      expect(
        (await get(world.users.owner, `/users/${principalId}/comments`)).status,
      ).toBe(404);
    const foreign = await world.scoped(
      world.b,
      world.users.outsider,
      async (_db, actor) => actor.principalId,
    );
    expect(
      (await get(world.users.owner, `/users/${foreign}/comments`)).status,
    ).toBe(404);
  });
});
