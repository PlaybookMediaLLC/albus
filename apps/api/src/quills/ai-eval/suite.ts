import { mkdirSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { and, count, gte, isNotNull, or, eq, sum } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it } from "vite-plus/test";
import { aiUsageLog } from "../../database/quills/schema/ai-usage-log";
import { jobQueue } from "../../database/quills/schema/job-queue";
import { aiConfig } from "../assistant/provider";
import { harness } from "../jobs/handlers/harness.fixture";
import { call, must } from "./api";
import { pool } from "./pool";
import { recorder, type Checks } from "./score";

/** The eval runs only when asked, on a local test database, with a chat and an embedding model. */
export const live =
  process.env.QUILLS_AI_EVAL === "1" &&
  Boolean(pool) &&
  Boolean(aiConfig()?.embeddingModel);

export type UsageRow = {
  model: string;
  calls: number;
  inputTokens: number;
  outputTokens: number;
};
/** The report of one feature, which scripts/ai-eval/compare.ts reads. */
export function writeReport(
  feature: string,
  bar: number,
  score: ReturnType<typeof recorder>,
  usage: UsageRow[],
) {
  const config = aiConfig();
  mkdirSync(out(), { recursive: true });
  writeFileSync(
    `${out()}/${feature}.json`,
    JSON.stringify(
      {
        feature,
        model: config?.model,
        embeddingModel: config?.embeddingModel,
        bar,
        passRate: score.passRate(),
        safetyFailures: score.results.filter((result) => !result.safe).length,
        // Per model: the chat model and the embedding model are priced apart.
        usage,
        cases: score.results,
        finishedAt: new Date().toISOString(),
      },
      null,
      2,
    ),
  );
}

type Harness = ReturnType<typeof harness>;
export type Kit = {
  h: Harness;
  /** A teammate route in workspace A that must succeed, for setup. */
  ok: (
    user: string,
    path: string,
    method?: string,
    body?: unknown,
  ) => ReturnType<typeof call>;
  /** A teammate route in workspace A. */
  api: (
    user: string,
    path: string,
    method?: string,
    body?: unknown,
  ) => ReturnType<typeof call>;
  /** One case. Quality checks count toward the bar; a failed `safety:` check fails the test. */
  case: (
    id: string,
    work: () => Promise<{ checks: Checks; detail?: string }>,
  ) => void;
  /**
   * Runs the workspace's jobs. A failed AI job runs again up to twice, as its backoff would in
   * production. Returns how many jobs still failed: a format or provider failure, not a wrong answer.
   */
  settle: (workspaceId?: string) => Promise<number>;
};

const slug = (text: string) => text.replace(/[^a-zA-Z0-9.-]+/g, "_");
const out = () =>
  process.env.QUILLS_AI_EVAL_OUT ??
  fileURLToPath(
    new URL(
      `../../../.cache/ai-eval/${slug(aiConfig()?.model ?? "none")}`,
      import.meta.url,
    ),
  );

async function settle(h: Harness, workspaceId: string) {
  const since = new Date();
  const erroring = () =>
    h.system(workspaceId, (db) =>
      db
        .select({ id: jobQueue.id, status: jobQueue.status })
        .from(jobQueue)
        .where(
          and(
            isNotNull(jobQueue.lastError),
            gte(jobQueue.updatedAt, since),
            or(eq(jobQueue.status, "pending"), eq(jobQueue.status, "failed")),
          ),
        ),
    );
  await h.drain(workspaceId);
  for (let retry = 0; retry < 2; retry++) {
    if (!(await erroring()).some((job) => job.status === "pending")) break;
    await h.due(workspaceId);
    await h.drain(workspaceId);
  }
  return (await erroring()).length;
}

/** A feature's eval: its cases, then the bar, then a report in .cache/ai-eval/<model>/. */
export function evalSuite(
  feature: string,
  bar: number,
  body: (kit: Kit) => void,
) {
  const h = harness(`eval_${feature.replace(/\W/g, "_")}`);
  const score = recorder();
  const kit: Kit = {
    h,
    api: (user, path, method, payload) =>
      call(h.a, user, path, method, payload),
    ok: (user, path, method, payload) =>
      must(
        call(h.a, user, path, method, payload),
        `${method ?? "GET"} ${path}`,
      ),
    case: (id, work) =>
      it(id, async () => {
        const result = await score.run(id, work);
        expect(
          result.safe,
          `${id}: ${Object.keys(result.checks).join(", ")} | ${result.detail ?? ""}`,
        ).toBe(true);
      }),
    settle: (workspaceId = h.a) => settle(h, workspaceId),
  };
  describe.skipIf(!live)(`AI eval: ${feature}`, () => {
    beforeAll(async () => {
      await h.start(pool!, process.env.QUILLS_TEST_DATABASE_URL!);
    });
    afterAll(async () => {
      const usage = await h.system(h.a, (db) =>
        db
          .select({
            model: aiUsageLog.model,
            calls: count(),
            inputTokens: sum(aiUsageLog.inputTokens),
            outputTokens: sum(aiUsageLog.outputTokens),
          })
          .from(aiUsageLog)
          .groupBy(aiUsageLog.model),
      );
      writeReport(
        feature,
        bar,
        score,
        usage.map((row) => ({
          model: row.model,
          calls: row.calls,
          inputTokens: Number(row.inputTokens ?? 0),
          outputTokens: Number(row.outputTokens ?? 0),
        })),
      );
      await h.stop();
      await pool?.end();
    });
    body(kit);
    it(`meets the bar of ${Math.round(bar * 100)} %`, () => {
      expect(
        score.passRate(),
        score.failures().join("\n"),
      ).toBeGreaterThanOrEqual(bar);
    });
  });
}
