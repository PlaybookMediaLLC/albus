import { afterAll, beforeAll, describe, expect, it, vi } from "vite-plus/test";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import type { PostId, PrincipalId } from "@kaneo/ids";
import * as kaneo from "../../database/schema";
import { principal } from "../../database/quills/schema/auth";
import { boards } from "../../database/quills/schema/boards";
import { companies } from "../../database/quills/schema/companies";
import { postTasks } from "../../database/quills/schema/platform-links";
import { posts, postVotes } from "../../database/quills/schema/posts";
import { segments, userSegments } from "../../database/quills/schema/segments";
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
} from "./taxonomy-harness.fixture";
import { postIn } from "./seeds.fixture";

// Triage by customer value (#79): revenue, votes, segments and the team's scoring factors.

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
const owner = (method: string, path: string, body?: unknown) =>
  call(app, contractEnv(), contractEnv().owner, method, path, body);

/**
 * A board with three posts. "big" has one voter at a 500.00 company who is in the segment; "small"
 * has two voters at one 10.00 company; "none" has no votes.
 */
async function world() {
  const env = contractEnv();
  return env.scoped(env.a, async (db, actor) => {
    const [board] = await db
      .insert(boards)
      .values({ name: "Triage", slug: env.id("triage") })
      .returning({ id: boards.id });
    const [big, small] = await db
      .insert(companies)
      .values([
        { name: env.id("big"), mrrCents: 50000 },
        { name: env.id("small"), mrrCents: 1000 },
      ])
      .returning({ id: companies.id });
    const person = async (companyId: string) =>
      (
        await db
          .insert(principal)
          .values({
            type: "user",
            role: "user",
            createdAt: new Date(),
            companyId: companyId as never,
          })
          .returning({ id: principal.id })
      )[0]!.id;
    const [p1, p2, p3] = [
      await person(big!.id),
      await person(small!.id),
      await person(small!.id),
    ];
    const [segment] = await db
      .insert(segments)
      .values({ name: env.id("enterprise"), slug: env.id("enterprise") })
      .returning({ id: segments.id });
    await db
      .insert(userSegments)
      .values({ principalId: p1, segmentId: segment!.id });
    const post = async (title: string, voters: PrincipalId[]) => {
      const [row] = await db
        .insert(posts)
        .values({
          title,
          content: title,
          boardId: board!.id,
          principalId: actor.principalId,
          voteCount: voters.length,
        })
        .returning({ id: posts.id });
      for (const voter of voters)
        await db
          .insert(postVotes)
          .values({ postId: row!.id, principalId: voter });
      return row!.id;
    };
    return {
      boardId: board!.id,
      segmentId: segment!.id,
      big: await post("big", [p1]),
      small: await post("small", [p2, p3]),
      none: await post("none", []),
    };
  });
}

const list = async (query: Record<string, string>) => {
  const res = await owner("GET", `/posts?${new URLSearchParams(query)}`);
  expect(res.status).toBe(200);
  return res.body.items as {
    id: PostId;
    teamScore: number | null;
    demand: { mrrCents: number };
  }[];
};

describe.skipIf(!url)("Triage by customer value", () => {
  beforeAll(async () => {
    pool = new Pool({ connectionString: url, max: 5 });
    await startContract(pool, url!);
  }, 120000);
  afterAll(async () => {
    await removeMembers(contractEnv());
    await stopContract();
  }, 120000);

  it("sorts and filters by revenue, votes, segment and team score, in the same order across pages", async () => {
    const w = await world();
    const saved = await owner("PUT", "/feedback/scoring-factors", {
      factors: [
        { name: "Impact", weight: 3 },
        { name: "Effort", weight: -1 },
      ],
    });
    expect(saved.status).toBe(200);
    const [impact, effort] = saved.body.factors.map(
      (f: { id: string }) => f.id,
    );
    const score = (postId: string, i: number, e: number) =>
      owner("PUT", `/posts/${postId}/factor-scores`, {
        values: [
          { factorId: impact, value: i },
          { factorId: effort, value: e },
        ],
      });
    expect((await score(w.big, 2, 5)).body.score).toBe(1);
    expect((await score(w.small, 8, 2)).body.score).toBe(22);

    const ids = (items: { id: string }[]) => items.map((p) => p.id);
    const on = { boardIds: w.boardId, limit: "10" };
    expect(ids(await list({ ...on, sort: "mrr" }))).toEqual([
      w.big,
      w.small,
      w.none,
    ]);
    expect(ids(await list({ ...on, sort: "votes" }))).toEqual([
      w.small,
      w.big,
      w.none,
    ]);
    const byScore = await list({ ...on, sort: "score" });
    expect(byScore.map((p) => [p.id, p.teamScore])).toEqual([
      [w.small, 22],
      [w.big, 1],
      [w.none, null],
    ]);
    // Revenue counts each company once: two voters at the 10.00 company.
    expect(byScore[0]!.demand.mrrCents).toBe(1000);

    // One post per page, following the cursor.
    const paged: string[] = [];
    let cursor: string | undefined;
    do {
      const res = await owner(
        "GET",
        `/posts?${new URLSearchParams({ boardIds: w.boardId, sort: "score", limit: "1", ...(cursor && { cursor }) })}`,
      );
      paged.push(...ids(res.body.items));
      cursor = res.body.nextCursor ?? undefined;
    } while (cursor);
    expect(paged).toEqual([w.small, w.big, w.none]);

    expect(ids(await list({ ...on, minMrrCents: "10000" }))).toEqual([w.big]);
    expect(ids(await list({ ...on, minVotes: "2" }))).toEqual([w.small]);
    expect(ids(await list({ ...on, segmentIds: w.segmentId }))).toEqual([
      w.big,
    ]);
    expect(ids(await list({ ...on, minScore: "5" }))).toEqual([w.small]);
    expect(ids(await list({ ...on, minScore: "-3", sort: "score" }))).toEqual([
      w.small,
      w.big,
    ]);
  });

  it("refuses scoring factor changes and revenue reads without the permission, and hides another workspace", async () => {
    const env = contractEnv();
    const { postId } = await postIn(env, env.a);
    const member = await restrictedMember(env, [], "member");
    const put = await call(
      app,
      env,
      member,
      "PUT",
      "/feedback/scoring-factors",
      {
        factors: [{ name: "Reach", weight: 1 }],
      },
    );
    expect(put.status).toBe(403);
    const role = env.id("noquills");
    await env.db.insert(kaneo.workspaceRoleTable).values({
      workspaceId: env.a,
      role,
      permission: JSON.stringify({ workspace: ["read"], project: ["read"] }),
      createdAt: new Date(),
    });
    const outsider = await restrictedMember(env, [], role);
    for (const path of [
      `/posts/${postId}/demand`,
      "/feedback/revenue-at-risk",
      "/posts?sort=mrr",
      "/feedback/scoring-factors",
    ])
      expect((await call(app, env, outsider, "GET", path)).status).toBe(403);
    // Another workspace's post and segment: 404 and no rows.
    const foreign = await postIn(env, env.b);
    const [foreignSegment] = await env.scoped(env.b, (db) =>
      db
        .insert(segments)
        .values({ name: env.id("b-segment"), slug: env.id("b-segment") })
        .returning({ id: segments.id }),
    );
    expect(
      (
        await owner("PUT", `/posts/${foreign.postId}/factor-scores`, {
          values: [],
        })
      ).status,
    ).toBe(404);
    expect(await list({ segmentIds: foreignSegment!.id })).toEqual([]);
  });

  it("never brings back a removed factor's values, and counts only numbers", async () => {
    const env = contractEnv();
    const { postId, boardId } = await postIn(env, env.a);
    const first = await owner("PUT", "/feedback/scoring-factors", {
      factors: [{ name: "Reach", weight: 2 }],
    });
    const reach = first.body.factors[0].id;
    await owner("PUT", `/posts/${postId}/factor-scores`, {
      values: [{ factorId: reach, value: 9 }],
    });
    await owner("PUT", "/feedback/scoring-factors", { factors: [] });
    // A client that sends the old ID back gets a new factor.
    const again = await owner("PUT", "/feedback/scoring-factors", {
      factors: [{ id: reach, name: "Reach", weight: 2 }],
    });
    expect(again.body.factors[0].id).not.toBe(reach);
    const scored = async () =>
      (await list({ boardIds: boardId, sort: "score" })).find(
        (p) => p.id === postId,
      )!.teamScore;
    expect(await scored()).toBeNull();
    // A stored value that is not a number (for example from an archive) counts as 0, not an error.
    const id = again.body.factors[0].id;
    await env.scoped(env.a, (db) =>
      db
        .update(posts)
        .set({ scoreValues: { [id]: "high" } as never })
        .where(eq(posts.id, postId as never)),
    );
    const res = await owner(
      "GET",
      `/posts?${new URLSearchParams({ boardIds: boardId, sort: "score", minScore: "-5" })}`,
    );
    expect(res.status).toBe(200);
  });

  it("never changes a linked Kaneo task when a post is scored", async () => {
    const env = contractEnv();
    const { postId } = await postIn(env, env.a);
    const projectId = env.id("project");
    await env.db.insert(kaneo.projectTable).values({
      id: projectId,
      workspaceId: env.a,
      name: "Roadmap",
      slug: projectId,
    });
    const taskId = env.id("task");
    await env.db
      .insert(kaneo.taskTable)
      .values({ id: taskId, projectId, title: "Ship it", number: 1 });
    await env.scoped(env.a, (db) =>
      db.insert(postTasks).values({ postId, taskId }),
    );
    const task = () =>
      env.db
        .select()
        .from(kaneo.taskTable)
        .where(eq(kaneo.taskTable.id, taskId));
    const before = await task();
    const saved = await owner("PUT", "/feedback/scoring-factors", {
      factors: [{ name: "Impact", weight: 2 }],
    });
    const factorId = saved.body.factors[0].id;
    expect(
      (
        await owner("PUT", `/posts/${postId}/factor-scores`, {
          values: [{ factorId, value: 9 }],
        })
      ).status,
    ).toBe(200);
    expect(
      (
        await owner("PUT", `/posts/${postId}/score`, {
          reach: 10,
          impact: 3,
          confidence: 100,
          effort: 1,
        })
      ).status,
    ).toBe(200);
    expect(await task()).toEqual(before);
  });
});
