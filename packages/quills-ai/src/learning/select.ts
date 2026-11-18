/**
 * Picks the examples that go into one prompt.
 *
 * Order of work: threshold on similarity, de-duplication, ranking, answer balance for yes/no tasks,
 * per-example cut, total cap, then ascending rank so that the best example sits next to the real
 * question. Deterministic for a given `now`.
 * Ranking: (1 - freshnessWeight) × similarity + freshnessWeight × freshness, where freshness is
 * 1 / (1 + age / half-life): a decision at the half-life counts half as fresh as one made today.
 * Team habits change, so a recent decision may beat a slightly closer old one (after Cossistant's
 * memory ranking; the weights here keep similarity dominant). The newer decision wins a tie.
 * Balance: when both answers pass the threshold, each answer gets at most `maxSameAnswer` examples,
 * so a team that accepts most suggestions does not teach the model to say "duplicate" every time.
 * When only one answer exists, it fills up to `k`.
 * ponytail: no diversity re-rank (MMR); add one if the examples repeat one theme in practice.
 */
import { clip } from "./text.js";
import {
  SelectOptionsSchema,
  type Example,
  type SelectOptions,
} from "./types.js";

const DAY_MS = 24 * 60 * 60 * 1000;

const answerOf = (example: Example) =>
  example.task === "duplicate" ? String(example.output.duplicate) : "tags";

export function selectExamples(
  candidates: Example[],
  options: SelectOptions,
): Example[] {
  const o = SelectOptionsSchema.parse(options);
  if (o.k === 0) return [];

  const best = new Map<string, Example>();
  for (const candidate of candidates) {
    if (candidate.similarity < o.minSimilarity) continue;
    const seen = best.get(candidate.key);
    if (!seen || candidate.similarity > seen.similarity)
      best.set(candidate.key, candidate);
  }
  const now = (o.now ?? new Date()).getTime();
  const score = (example: Example) => {
    const ageDays = Math.max(0, now - example.decidedAt.getTime()) / DAY_MS;
    const freshness = 1 / (1 + ageDays / o.freshnessHalfLifeDays);
    return (
      (1 - o.freshnessWeight) * example.similarity +
      o.freshnessWeight * freshness
    );
  };
  const ordered = [...best.values()]
    .map((example) => ({ example, score: score(example) }))
    .sort(
      (a, b) =>
        b.score - a.score ||
        b.example.decidedAt.getTime() - a.example.decidedAt.getTime(),
    )
    .map(({ example }) => example);

  const cap =
    new Set(ordered.map(answerOf)).size > 1 ? o.maxSameAnswer : undefined;
  const counts = new Map<string, number>();
  const picked: Example[] = [];
  let chars = 0;
  for (const candidate of ordered) {
    if (picked.length >= o.k) break;
    const answer = answerOf(candidate);
    const count = counts.get(answer) ?? 0;
    if (cap !== undefined && count >= cap) continue;
    const input = clip(candidate.input, o.maxCharsPerExample);
    if (chars + input.length > o.maxCharsTotal) break;
    chars += input.length;
    counts.set(answer, count + 1);
    picked.push({ ...candidate, input });
  }
  return picked.reverse();
}
