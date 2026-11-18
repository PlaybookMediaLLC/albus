/**
 * The store port, and the one entry point that calls it.
 *
 * The API implements ExampleStore over its tables; InMemoryExampleStore is the reference. Every
 * store must follow the contract in the README: filter on the scope, the embedding model and the
 * visible boards, use a subject's stored vector when it has none, rank by similarity to the closest
 * subject, return at most `limit` rows nearest first, never return an excluded key or a subject,
 * return [] for no data, and throw for a real failure. findExamples is the only way callers reach a
 * store, so the guards run every time.
 */
import { LearningError } from "./errors.js";
import {
  ExampleQuerySchema,
  ExampleSchema,
  type Example,
  type ExampleQuery,
  type ParsedExampleQuery,
} from "./types.js";

export type ExampleStore = {
  /** The vector length of this store, for example 1536. */
  readonly dimensions: number;
  findExamples(query: ParsedExampleQuery): Promise<unknown[]>;
};

export async function findExamples(
  store: ExampleStore,
  query: ExampleQuery,
): Promise<Example[]> {
  const parsed = ExampleQuerySchema.safeParse(query);
  if (!parsed.success) throw new LearningError("invalid_query");
  for (const { embedding } of parsed.data.subjects)
    if (embedding && embedding.length !== store.dimensions)
      throw new LearningError(
        "dimension_mismatch",
        `${embedding.length} != ${store.dimensions}`,
      );
  const rows = await store.findExamples(parsed.data);
  return rows.map((row) => {
    const example = ExampleSchema.safeParse(row);
    if (!example.success || example.data.task !== parsed.data.task)
      throw new LearningError("invalid_example");
    return example.data;
  });
}
