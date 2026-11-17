import { afterAll, beforeAll, describe, expect, it, vi } from "vite-plus/test";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import type { TypeId } from "@kaneo/ids";
import { principal } from "../../database/quills/schema/auth";
import { boards } from "../../database/quills/schema/boards";
import { posts, postVotes } from "../../database/quills/schema/posts";
import * as kaneo from "../../database/schema";
import { startFeature } from "./harness.fixture";

// D3 of the Requests parity plan: Trending is the number of people who voted in the last 7 days
// (with the votes on merged posts, each person once, without test customers), then the most
// votes. Stale is the least recently changed first.

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
type Key = "two" | "dup" | "tested" | "high" | "low";
let ids: Record<Key, TypeId<"post">> & { board: TypeId<"board"> };
const DAY = 86_400_000;

describe.skipIf(!url)("Quills post sorts", () => {
  beforeAll(async () => {
    pool = new Pool({ connectionString: url, max: 5 });
    world = await startFeature(pool, url!, "sorts");
    ids = await world.scoped(world.a, world.users.owner, async (db, actor) => {
      const [board] = await db
        .insert(boards)
        .values({ name: "Sorts", slug: `sorts-${Date.now()}` })
        .returning({ id: boards.id });
      const people = (count: number, test: boolean) =>
        db
          .insert(principal)
          .values(
            Array.from({ length: count }, (_, n) => ({
              type: "user" as const,
              role: "user" as const,
              displayName: `${test ? "Test" : "Voter"} ${n}`,
              createdAt: new Date(),
              testOwnerPrincipalId: test ? actor.principalId : null,
            })),
          )
          .returning({ id: principal.id });
      const voters = await people(3, false);
      // An owner has at most one test customer.
      const testers = await people(1, true);
      const post = async (voteCount: number, updatedDaysAgo: number) =>
        (
          await db
            .insert(posts)
            .values({
              title: "Sort",
              content: "Sort",
              boardId: board!.id,
              principalId: voters[0]!.id,
              voteCount,
              updatedAt: new Date(Date.now() - updatedDaysAgo * DAY),
            })
            .returning({ id: posts.id })
        )[0]!.id;
      const vote = (
        postId: TypeId<"post">,
        who: { id: TypeId<"principal"> }[],
        daysAgo: number,
      ) =>
        db.insert(postVotes).values(
          who.map((voter) => ({
            postId,
            principalId: voter.id,
            createdAt: new Date(Date.now() - daysAgo * DAY),
          })),
        );
      const two = await post(2, 2);
      const dup = await post(1, 3);
      const tested = await post(0, 1);
      const high = await post(5, 30);
      const low = await post(2, 40);
      const merged = await post(0, 4);
      await db
        .update(posts)
        .set({ canonicalPostId: dup, mergedAt: new Date() })
        .where(eq(posts.id, merged));
      // Two people this week.
      await vote(two, voters.slice(0, 2), 1);
      // Three votes by two people: voter 0 voted on the post and on the duplicate merged into it.
      // Counted once each, dup ties with two, and the vote count puts two first.
      await vote(dup, voters.slice(0, 1), 1);
      await vote(merged, [voters[0]!, voters[2]!], 2);
      // A test customer only: counted as no one, so it does not rank above high and low.
      await vote(tested, testers, 1);
      // Votes older than 7 days: the vote count decides between these two.
      await vote(high, voters, 30);
      await vote(low, voters.slice(0, 2), 30);
      return { board: board!.id, two, dup, tested, high, low };
    });
  }, 120000);
  afterAll(() => world?.stop());

  /** Every post of the board in the sort, two per page, through the cursors. */
  const all = async (sort: string) => {
    const found: string[] = [];
    let cursor: string | null = null;
    do {
      const res = await world.request(
        world.users.owner,
        "GET",
        `/posts?boardIds=${ids.board}&sort=${sort}&limit=2${cursor ? `&cursor=${cursor}` : ""}`,
      );
      expect(res.status).toBe(200);
      found.push(...res.body.items.map((post: { id: string }) => post.id));
      cursor = res.body.nextCursor;
    } while (cursor);
    return found;
  };

  it("sorts by the recent voters, each once and without test customers, then by votes", async () => {
    // Pages: [two, dup], [high, low], [tested]. The last two pages split posts with no recent
    // voter, so the cursor uses the vote count.
    expect(await all("trending")).toEqual([
      ids.two,
      ids.dup,
      ids.high,
      ids.low,
      ids.tested,
    ]);
  });

  it("sorts the least recently changed first, through the cursor pages", async () => {
    expect(await all("stale")).toEqual([
      ids.low,
      ids.high,
      ids.dup,
      ids.two,
      ids.tested,
    ]);
  });
});
