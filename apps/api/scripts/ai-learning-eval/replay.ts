// Offline replay for issue #275: do examples from earlier teammate decisions improve the duplicate
// check and the tag backfill? Development only: never in CI and never in the image.
//
// Run from apps/api with a development provider (never production data or keys):
//   set -a; . ../../.env; set +a        # QUILLS_AI_BASE_URL, QUILLS_AI_MODEL, QUILLS_AI_EMBEDDING_MODEL
//   node --import tsx scripts/ai-learning-eval/replay.ts duplicates
//   node --import tsx scripts/ai-learning-eval/replay.ts tags
//
// It reads labelled items written for this purpose, sorts them by decision time, and asks the model
// twice for item i: with today's request, and with examples that @quills/ai chooses from items
// 1..i-1, as the jobs do. It uses the shipped capabilities (@quills/ai/learning), the shipped
// selection and the real provider client, so the numbers measure the code that ships.
import { readFileSync } from "node:fs";
import {
  chooseTags,
  DUPLICATE_CONFIDENCE,
  findExamples,
  InMemoryExampleStore,
  judgeDuplicate,
  type MemoryRow,
  PAIR_SIDE_CHARS,
  renderExamples,
  selectExamples,
  TASKS,
} from "@quills/ai/learning";
import { runCapability } from "../../src/quills/assistant/ai/run";
import {
  aiConfig,
  embed,
  EMBEDDING_DIMENSIONS,
  untrusted,
} from "../../src/quills/assistant/provider";

type Pair = {
  first: string;
  second: string;
  duplicate: boolean;
  decidedAt: string;
};
type Tagged = { text: string; tags: string[]; decidedAt: string };

const read = <T>(file: string): T[] =>
  readFileSync(new URL(file, import.meta.url), "utf8")
    .split("\n")
    .filter(Boolean)
    .map((line) => JSON.parse(line) as T)
    .sort((a, b) =>
      String((a as { decidedAt: string }).decidedAt).localeCompare(
        (b as { decidedAt: string }).decidedAt,
      ),
    );

async function embedAll(texts: string[]) {
  const out: number[][] = [];
  for (let i = 0; i < texts.length; i += 32)
    out.push(...(await embed(texts.slice(i, i + 32))).vectors);
  return out;
}

const scope = "eval";
const board = [{ id: "board", linked: false }];
const visibility = { boardIds: [], includeUnlinkedBoards: true };
const percent = (part: number, whole: number) =>
  whole ? `${((100 * part) / whole).toFixed(1)} %` : "n/a";

async function duplicates(model: string) {
  const items = read<Pair>("duplicates.jsonl");
  const vectors = await embedAll(
    items.flatMap((item) => [item.first, item.second]),
  );
  const side = (text: string) => text.slice(0, PAIR_SIDE_CHARS);
  const counts = {
    base: { tp: 0, fp: 0, tn: 0, fn: 0 },
    examples: { tp: 0, fp: 0, tn: 0, fn: 0 },
  };
  let withExamples = 0;
  for (let i = 0; i < items.length; i++) {
    const item = items[i]!;
    const rows: MemoryRow[] = items.slice(0, i).map((past, j) => ({
      scopeId: scope,
      embeddingModel: model,
      boards: [...board, ...board],
      postKeys: [`p${j}a`, `p${j}b`],
      vectors: [vectors[2 * j]!, vectors[2 * j + 1]!],
      example: {
        task: "duplicate",
        key: `s${j}`,
        input: `first: ${side(past.first)}\nsecond: ${side(past.second)}`,
        output: { duplicate: past.duplicate },
        decidedAt: new Date(past.decidedAt),
      },
    }));
    const found = await findExamples(
      new InMemoryExampleStore(EMBEDDING_DIMENSIONS, rows),
      {
        task: "duplicate",
        scopeId: scope,
        subjects: [{ key: `p${i}a`, embedding: vectors[2 * i]! }],
        embeddingModel: model,
        visibility,
        excludeKeys: [`p${i}b`],
      },
    );
    const picked = selectExamples(found, {
      ...TASKS.duplicate,
      now: new Date(item.decidedAt),
    });
    if (picked.length) withExamples++;
    const block = renderExamples("duplicate", picked, untrusted);
    for (const [run, examples] of [
      ["base", null],
      ["examples", block],
    ] as const) {
      const { value } = await runCapability(judgeDuplicate, {
        first: item.first,
        second: item.second,
        examples,
      });
      const said = value.duplicate && value.confidence >= DUPLICATE_CONFIDENCE;
      const tally = counts[run];
      if (said && item.duplicate) tally.tp++;
      else if (said) tally.fp++;
      else if (item.duplicate) tally.fn++;
      else tally.tn++;
    }
  }
  console.log(
    `Duplicate check: ${items.length} pairs, ${withExamples} with examples`,
  );
  console.table(counts);
  const change = (key: "fp" | "tp") =>
    percent(counts.examples[key] - counts.base[key], counts.base[key]);
  console.log(
    `False positives: ${counts.base.fp} -> ${counts.examples.fp} (${change("fp")})`,
  );
  console.log(
    `True positives: ${counts.base.tp} -> ${counts.examples.tp} (${change("tp")})`,
  );
  console.log(
    "Targets (issue #275, section 16.3): false positives at least 20 % fewer; true positives not more than 5 % fewer.",
  );
}

async function tags(model: string) {
  const items = read<Tagged>("tags.jsonl");
  const names = [...new Set(items.flatMap((item) => item.tags))].sort();
  const list = names.map((name, i) => ({ id: `t${i + 1}`, name }));
  const idOf = new Map(list.map((tag) => [tag.id, tag.name]));
  const vectors = await embedAll(items.map((item) => item.text));
  const counts = {
    base: { correct: 0, chosen: 0, expected: 0 },
    examples: { correct: 0, chosen: 0, expected: 0 },
  };
  let withExamples = 0;
  for (let i = 0; i < items.length; i++) {
    const item = items[i]!;
    const rows: MemoryRow[] = items.slice(0, i).map((past, j) => ({
      scopeId: scope,
      embeddingModel: model,
      boards: board,
      postKeys: [`p${j}`],
      vectors: [vectors[j]!],
      example: {
        task: "tags",
        key: `p${j}`,
        input: past.text,
        output: { tags: past.tags },
        decidedAt: new Date(past.decidedAt),
      },
    }));
    const found = await findExamples(
      new InMemoryExampleStore(EMBEDDING_DIMENSIONS, rows),
      {
        task: "tags",
        scopeId: scope,
        subjects: [{ key: `p${i}`, embedding: vectors[i]! }],
        embeddingModel: model,
        visibility,
      },
    );
    const picked = selectExamples(found, {
      ...TASKS.tags,
      now: new Date(item.decidedAt),
    });
    if (picked.length) withExamples++;
    const block = renderExamples("tags", picked, untrusted);
    for (const [run, examples] of [
      ["base", null],
      ["examples", block],
    ] as const) {
      const { value } = await runCapability(chooseTags, {
        tags: list,
        posts: `p${i}: ${item.text}`,
        examples,
      });
      const chosen = new Set(
        (value.posts.find((entry) => entry.postId === `p${i}`)?.tagIds ?? [])
          .map((id) => idOf.get(id))
          .filter((name): name is string => Boolean(name)),
      );
      const tally = counts[run];
      tally.chosen += chosen.size;
      tally.expected += item.tags.length;
      tally.correct += item.tags.filter((tag) => chosen.has(tag)).length;
    }
  }
  console.log(
    `Tag backfill: ${items.length} posts, ${withExamples} with examples`,
  );
  for (const run of ["base", "examples"] as const) {
    const tally = counts[run];
    console.log(
      `${run}: precision ${percent(tally.correct, tally.chosen)}, recall ${percent(tally.correct, tally.expected)}`,
    );
  }
  console.log(
    "Targets (issue #275, section 16.3): precision higher; recall not more than 5 % lower.",
  );
}

const task = process.argv[2];
const config = aiConfig();
if (!config?.embeddingModel || (task !== "duplicates" && task !== "tags")) {
  console.error(
    "Usage: node --import tsx scripts/ai-learning-eval/replay.ts duplicates|tags\n" +
      "Set QUILLS_AI_BASE_URL, QUILLS_AI_MODEL and QUILLS_AI_EMBEDDING_MODEL to a development provider.",
  );
  process.exit(1);
}
await (task === "duplicates" ? duplicates : tags)(config.embeddingModel);
