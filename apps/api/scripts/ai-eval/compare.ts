// Finds the cheapest chat model that passes the live AI eval (src/quills/ai-eval/README.md).
// Development only: never in CI and never in the image. Run from apps/api:
//   pnpm eval:ai:compare                       # the 3 cheapest OpenRouter models with JSON and tools
//   pnpm eval:ai:compare --top 5
//   pnpm eval:ai:compare --models a/b,c/d      # these models
// It runs the whole eval once per model on the disposable QUILLS_TEST_DATABASE_URL, reads the
// reports in .cache/ai-eval/<model>/, prices the chat tokens with OpenRouter's public model list
// and writes .cache/ai-eval/summary.md. Embedding tokens are the same for every model.
import { spawnSync } from "node:child_process";
import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { parseArgs } from "node:util";
import { z } from "zod";

const { values } = parseArgs({
  options: {
    models: { type: "string" },
    top: { type: "string", default: "3" },
  },
});
const root = new URL("../../.cache/ai-eval/", import.meta.url);
const slug = (text: string) => text.replace(/[^a-zA-Z0-9.-]+/g, "_");

const listing = z.object({
  data: z.array(
    z.object({
      id: z.string(),
      pricing: z.object({
        prompt: z.coerce.number(),
        completion: z.coerce.number(),
      }),
      supported_parameters: z.array(z.string()).optional(),
      context_length: z.number().nullable().optional(),
    }),
  ),
});
// The public list needs no key and receives no data of ours. Without it, named models still run
// (no cost column); choosing the cheapest models needs it.
const models = await fetch("https://openrouter.ai/api/v1/models", {
  signal: AbortSignal.timeout(15_000),
})
  .then(async (response) => listing.parse(await response.json()).data)
  .catch((error: unknown) => {
    if (!values.models) throw error;
    console.warn(`No price list: ${String(error)}`);
    return [];
  });
const price = new Map(models.map((model) => [model.id, model.pricing]));
// Every feature must report: a suite that crashed before its report must not count as a pass.
const featureCount = readdirSync(
  new URL("../../src/quills/ai-eval/", import.meta.url),
).filter((file) => file.endsWith(".eval.ts")).length;

const candidates = values.models
  ? values.models
      .split(",")
      .map((id) => id.trim())
      .filter(Boolean)
  : models
      .filter(
        (model) =>
          !model.id.endsWith(":free") &&
          model.pricing.prompt > 0 &&
          (model.context_length ?? 0) >= 32_000 &&
          ["response_format", "tools"].every((name) =>
            model.supported_parameters?.includes(name),
          ),
      )
      .sort(
        (a, b) =>
          a.pricing.prompt +
          4 * a.pricing.completion -
          (b.pricing.prompt + 4 * b.pricing.completion),
      )
      .slice(0, Number(values.top))
      .map((model) => model.id);
console.log(`Models: ${candidates.join(", ")}`);

type Report = {
  feature: string;
  bar: number;
  passRate: number;
  safetyFailures: number;
  usage: {
    model: string;
    calls: number;
    inputTokens: number;
    outputTokens: number;
  }[];
  cases: unknown[];
};
const rows = [];
for (const model of candidates) {
  const out = new URL(`${slug(model)}/`, root);
  mkdirSync(out, { recursive: true });
  // Reports of an earlier run must not count.
  for (const file of readdirSync(out)) rmSync(new URL(file, out));
  spawnSync(
    "pnpm",
    [
      "exec",
      "vp",
      "test",
      "run",
      "--config",
      "src/quills/ai-eval/vitest.config.ts",
    ],
    {
      stdio: "inherit",
      env: {
        ...process.env,
        QUILLS_AI_EVAL: "1",
        // Every role uses the model under test, whatever .env sets for one role.
        QUILLS_AI_MODEL: model,
        QUILLS_AI_MODEL_FAST: model,
        QUILLS_AI_MODEL_DEEP: model,
        QUILLS_AI_EVAL_OUT: out.pathname,
      },
    },
  );
  const reports = readdirSync(out)
    .map(
      (file) => JSON.parse(readFileSync(new URL(file, out), "utf8")) as Report,
    )
    .filter((report) => report.feature);
  const chat = reports.flatMap((report) =>
    report.usage.filter((entry) => entry.model === model),
  );
  const pricing = price.get(model);
  const cost = pricing
    ? chat.reduce(
        (total, entry) =>
          total +
          entry.inputTokens * pricing.prompt +
          entry.outputTokens * pricing.completion,
        0,
      )
    : Number.NaN;
  const calls = chat.reduce((total, entry) => total + entry.calls, 0);
  rows.push({
    model,
    passes:
      reports.length === featureCount &&
      reports.every(
        (report) =>
          report.passRate >= report.bar && report.safetyFailures === 0,
      ),
    safety: reports.reduce((total, report) => total + report.safetyFailures, 0),
    features: Object.fromEntries(
      reports.map((report) => [
        report.feature,
        Math.round(report.passRate * 100),
      ]),
    ),
    bars: Object.fromEntries(
      reports.map((report) => [report.feature, Math.round(report.bar * 100)]),
    ),
    calls,
    cost,
    per1000: calls ? (cost / calls) * 1000 : Number.NaN,
  });
}

const features = [
  ...new Set(rows.flatMap((row) => Object.keys(row.features))),
].sort();
const passing = rows
  .filter((row) => row.passes)
  // Every model runs the same cases, so the run cost compares them.
  .sort((a, b) => a.cost - b.cost);
const lines = [
  "# AI eval: model comparison",
  "",
  `| Model | Passes | Safety failures | ${features.map((f) => `${f} (bar)`).join(" | ")} | Chat calls | Run cost (USD) | Per 1,000 calls (USD) |`,
  `|---|---|---|${features.map(() => "---").join("|")}|---|---|---|`,
  ...rows.map(
    (row) =>
      `| ${row.model} | ${row.passes ? "yes" : "no"} | ${row.safety} | ${features
        .map((f) => `${row.features[f] ?? "-"} % (${row.bars[f] ?? "-"})`)
        .join(
          " | ",
        )} | ${row.calls} | ${row.cost.toFixed(4)} | ${row.per1000.toFixed(3)} |`,
  ),
  "",
  passing[0]
    ? `Recommendation: ${passing[0].model}, the cheapest model that passes every bar with no safety failure.\n\nFor cost tracking, set in .env: QUILLS_AI_PRICES=${JSON.stringify(
        Object.fromEntries(
          [passing[0].model, process.env.QUILLS_AI_EMBEDDING_MODEL ?? ""]
            .filter((id) => price.has(id))
            .map((id) => [
              id,
              {
                input: price.get(id)!.prompt * 1_000_000,
                output: price.get(id)!.completion * 1_000_000,
              },
            ]),
        ),
      )}`
    : "Recommendation: none. No model passed every bar; read the failed cases in each report.",
];
if (!existsSync(root)) mkdirSync(root, { recursive: true });
writeFileSync(new URL("summary.md", root), `${lines.join("\n")}\n`);
console.log(lines.join("\n"));
