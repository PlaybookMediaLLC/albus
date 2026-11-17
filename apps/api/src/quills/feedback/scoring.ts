import { desc, eq, sql, type SQL } from "drizzle-orm";
import { HTTPException } from "hono/http-exception";
import { flexibleToTypeIdSchema } from "@kaneo/ids/zod";
import { apiRouter, z, type BaseVariables } from "../../openapi";
import { posts } from "../../database/quills/schema/posts";
import { defineQuillsRoute, type Database } from "../framework/define-route";
import type { Sort } from "./post-filters";
import { findPost, loadProjects } from "./visibility";
import { readSettingsKey, writeSettingsKey } from "./settings-json";

// Team scoring factors (#79). The team names up to ten factors, such as impact and effort, and
// weights each from -10 to 10; a negative weight is a cost. Each post gets a value from 0 to 10 per
// factor, and its score is the sum of weight × value. A score ranks requests; it never changes a
// Kaneo task. Factors live in settings.metadata.scoringFactors, values in posts.score_values.

const KEY = "scoringFactors";
const factorId = z
  .string()
  .regex(
    /^[a-z0-9]{1,16}$/,
    "A factor ID is 1 to 16 lowercase letters or digits",
  );
const factor = z.object({
  id: factorId,
  name: z.string().trim().min(1).max(60),
  weight: z
    .number()
    .int()
    .min(-10)
    .max(10)
    .refine((weight) => weight !== 0, "A weight is not 0"),
});
const factors = z
  .array(factor)
  .max(10)
  .refine(
    (list) => new Set(list.map((f) => f.id)).size === list.length,
    "Each factor needs its own ID",
  );
export type Factor = z.output<typeof factor>;
const factorsResponse = z.object({ factors: z.array(factor) });

/** The workspace's factors. A stored value that does not parse reads as none. */
export async function loadFactors(db: Database): Promise<Factor[]> {
  return (
    factors.safeParse(await readSettingsKey(db, "metadata", KEY)).data ?? []
  );
}

type Values = { factorId: string; value: number }[];

/** A post's score: the sum of weight × value, or null when no factor has a value. */
export function scoreOf(list: Factor[], values: Values) {
  let score: number | null = null;
  for (const f of list) {
    const found = values.find((v) => v.factorId === f.id);
    if (found) score = (score ?? 0) + f.weight * found.value;
  }
  return score;
}

/** scoreOf in SQL for a `posts` row; -infinity without a value, so such posts sort last. */
export function scoreSql(row: SQL, list: Factor[]) {
  if (!list.length) return sql`'-infinity'::float8`;
  const ids = sql.join(
    list.map((f) => sql`${f.id}`),
    sql`, `,
  );
  const sum = sql.join(
    list.map(
      (f) =>
        // A value that is not a JSON number (for example from an imported archive) counts as 0.
        sql`(case when jsonb_typeof(${row}.score_values -> ${f.id}) = 'number' then (${row}.score_values ->> ${f.id})::float8 else 0 end) * ${f.weight}::float8`,
    ),
    sql` + `,
  );
  return sql`(case when ${row}.score_values ?| array[${ids}]::text[] then ${sum} else '-infinity'::float8 end)`;
}

/** The teammate list order by team score, highest first; posts without a value last. */
export function scoreSort(list: Factor[]): Sort {
  const score = scoreSql(sql`${posts}`, list);
  return {
    order: [desc(score), desc(posts.createdAt), desc(posts.id)],
    key: sql`(${score}, ${posts.createdAt}, ${posts.id}) <`,
    cursor: sql`${scoreSql(sql`cursor_post`, list)}, cursor_post.created_at, cursor_post.id`,
  };
}

const getFactors = defineQuillsRoute({
  method: "get",
  path: "/feedback/scoring-factors",
  operationId: "getQuillsScoringFactors",
  summary: "List the team's scoring factors",
  description:
    "Each factor has an ID, a name and a weight from -10 to 10 (negative for a cost such as effort). A post's score is the sum of weight × its value for the factor.",
  action: "read",
  response: factorsResponse,
  responseDescription: "The scoring factors",
  handler: async ({ db }) => ({ factors: await loadFactors(db) }),
});

const setFactors = defineQuillsRoute({
  method: "put",
  path: "/feedback/scoring-factors",
  operationId: "setQuillsScoringFactors",
  summary: "Replace the team's scoring factors",
  description:
    "Desired state, up to 10 factors. Send a stored factor's ID to keep the values that posts have for it; a factor without a stored ID gets a new one, so a removed factor's values never count again.",
  action: "manage_settings",
  body: z.object({
    factors: z.array(factor.extend({ id: factorId.optional() })).max(10),
  }),
  response: factorsResponse,
  responseDescription: "The saved scoring factors",
  errors: { 400: "Invalid factors" },
  event: ({ workspaceId }, result) => ({
    type: "settings.scoring_updated",
    entityType: "settings",
    entityId: workspaceId,
    payload: { factors: String(result.factors.length) },
  }),
  handler: async ({ db, body }) => {
    const stored = new Set((await loadFactors(db)).map((f) => f.id));
    const parsed = factors.safeParse(
      body.factors.map((f) => ({
        ...f,
        id:
          f.id && stored.has(f.id)
            ? f.id
            : crypto.randomUUID().replaceAll("-", "").slice(0, 12),
      })),
    );
    if (!parsed.success)
      throw new HTTPException(400, {
        message: parsed.error.issues[0]!.message,
      });
    return {
      factors: await writeSettingsKey(db, "metadata", KEY, () => parsed.data),
    };
  },
});

const setValues = defineQuillsRoute({
  method: "put",
  path: "/posts/{postId}/factor-scores",
  operationId: "setQuillsPostFactorScores",
  summary: "Set a post's values for the team's scoring factors",
  description:
    "Each value names a factor ID and is 0 to 10; null clears it. Values that are not sent stay. Values of removed factors are dropped. Only the post's ranking changes: no linked task changes.",
  action: "update",
  params: z.object({ postId: flexibleToTypeIdSchema("post") }),
  body: z.object({
    values: z
      .array(
        z.object({
          factorId,
          value: z.number().int().min(0).max(10).nullable(),
        }),
      )
      .max(10)
      .refine(
        (values) =>
          new Set(values.map((v) => v.factorId)).size === values.length,
        "Send each factor once",
      ),
  }),
  response: z.object({
    postId: z.string(),
    values: z.array(z.object({ factorId: z.string(), value: z.number() })),
    score: z.number().nullable(),
  }),
  responseDescription: "The post's factor values and score",
  errors: { 400: "A value names no factor", 404: "Post not found" },
  event: (_input, result) => ({
    type: "post.scored",
    entityType: "post",
    entityId: result.postId,
  }),
  load: loadProjects,
  handler: async ({ db, params, body, loaded: projects }) => {
    const post = await findPost(db, params.postId, projects);
    const list = await loadFactors(db);
    const known = new Set(list.map((f) => f.id));
    const unknown = body.values.find((v) => !known.has(v.factorId));
    if (unknown)
      throw new HTTPException(400, {
        message: `No scoring factor has the ID ${unknown.factorId}`,
      });
    const [row] = await db
      .select({ values: posts.scoreValues })
      .from(posts)
      .where(eq(posts.id, post.id))
      .for("update");
    const sent = new Map(body.values.map((v) => [v.factorId, v.value]));
    const stored: Record<string, number> = {};
    for (const id of known) {
      const next = sent.has(id) ? sent.get(id) : row!.values[id];
      if (typeof next === "number") stored[id] = next;
    }
    await db
      .update(posts)
      .set({ scoreValues: stored, updatedAt: new Date() })
      .where(eq(posts.id, post.id));
    const values = Object.entries(stored).map(([factorId, value]) => ({
      factorId,
      value,
    }));
    return { postId: post.id, values, score: scoreOf(list, values) };
  },
});

export default apiRouter<BaseVariables & { workspaceId: string }>()
  .openapi(...getFactors)
  .openapi(...setFactors)
  .openapi(...setValues);
