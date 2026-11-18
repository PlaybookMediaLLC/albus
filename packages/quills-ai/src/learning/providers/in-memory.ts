/**
 * The reference store. It follows the port contract in plain JavaScript, so the package can test
 * selection and rendering without a database, and so a real store has a behaviour to match.
 * Not for production: it holds every row in memory and scans all of them.
 */
import type { ExampleStore } from "../port.js";
import type { Example, ParsedExampleQuery } from "../types.js";

type WithoutSimilarity<T> = T extends unknown ? Omit<T, "similarity"> : never;

export type MemoryRow = {
  scopeId: string;
  embeddingModel: string;
  /** Every board that the row touches: one for a post, two for a pair. All must be visible. */
  boards: { id: string; linked: boolean }[];
  /** Every post key that the row touches, for excludeKeys and the subject rule. */
  postKeys: string[];
  /** One vector per post. A pair's similarity is the greater of the two. */
  vectors: number[][];
  example: WithoutSimilarity<Example>;
};

const cosine = (a: number[], b: number[]) => {
  let dot = 0;
  let na = 0;
  let nb = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i]! * b[i]!;
    na += a[i]! ** 2;
    nb += b[i]! ** 2;
  }
  return na && nb ? dot / Math.sqrt(na * nb) : 0;
};

export class InMemoryExampleStore implements ExampleStore {
  constructor(
    readonly dimensions: number,
    private readonly rows: MemoryRow[],
    /** Stored subject vectors, keyed by scope and then by post key. */
    private readonly stored = new Map<
      string,
      Map<string, { model: string; vector: number[] }>
    >(),
  ) {}

  async findExamples(query: ParsedExampleQuery): Promise<unknown[]> {
    const vectors = query.subjects.flatMap((subject) => {
      const own = this.stored.get(query.scopeId)?.get(subject.key);
      const vector =
        subject.embedding ??
        (own?.model === query.embeddingModel ? own.vector : null);
      return vector ? [vector] : [];
    });
    if (!vectors.length) return [];
    const excluded = new Set([
      ...query.excludeKeys,
      ...query.subjects.map((subject) => subject.key),
    ]);
    const visible = (board: { id: string; linked: boolean }) =>
      query.visibility.boardIds.includes(board.id) ||
      (query.visibility.includeUnlinkedBoards && !board.linked);
    return this.rows
      .filter(
        (row) =>
          row.scopeId === query.scopeId &&
          row.embeddingModel === query.embeddingModel &&
          row.example.task === query.task &&
          row.boards.every(visible) &&
          row.postKeys.every((key) => !excluded.has(key)),
      )
      .map((row) => ({
        ...row.example,
        similarity: Math.max(
          0,
          Math.min(
            1,
            Math.max(
              ...row.vectors.flatMap((v) => vectors.map((w) => cosine(v, w))),
            ),
          ),
        ),
      }))
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, query.limit);
  }
}
