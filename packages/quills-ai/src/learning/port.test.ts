import { describe, expect, it } from "vite-plus/test";
import { LearningError } from "./errors.js";
import { findExamples, type ExampleStore } from "./port.js";
import type { ExampleQuery } from "./types.js";

const query = (over: Partial<ExampleQuery> = {}): ExampleQuery => ({
  task: "tags",
  scopeId: "ws_a",
  subjects: [{ key: "post_1", embedding: [1, 0, 0] }],
  embeddingModel: "m1",
  visibility: { boardIds: [], includeUnlinkedBoards: true },
  ...over,
});
const returning = (rows: unknown[]): ExampleStore => ({
  dimensions: 3,
  findExamples: async () => rows,
});
const kind = async (work: Promise<unknown>) => {
  try {
    await work;
  } catch (error) {
    return error instanceof LearningError ? error.kind : "other";
  }
  return "none";
};

describe("findExamples", () => {
  it("rejects a query that the schema rejects", async () => {
    expect(
      await kind(findExamples(returning([]), query({ scopeId: "" }))),
    ).toBe("invalid_query");
  });

  it("rejects a fresh vector of the wrong length", async () => {
    const work = findExamples(
      returning([]),
      query({ subjects: [{ key: "post_1", embedding: [1, 0] }] }),
    );
    expect(await kind(work)).toBe("dimension_mismatch");
  });

  it("accepts a null vector: the store uses the stored one", async () => {
    const work = findExamples(
      returning([]),
      query({ subjects: [{ key: "post_1", embedding: null }] }),
    );
    expect(await work).toEqual([]);
  });

  it("rejects a row that the schema rejects, or a row of another task", async () => {
    expect(
      await kind(findExamples(returning([{ task: "tags" }]), query())),
    ).toBe("invalid_example");
    const duplicateRow = {
      task: "duplicate",
      key: "s1",
      input: "first: a\nsecond: b",
      output: { duplicate: true },
      similarity: 0.9,
      decidedAt: "2026-11-01T00:00:00Z",
    };
    expect(await kind(findExamples(returning([duplicateRow]), query()))).toBe(
      "invalid_example",
    );
  });

  it("passes the parsed query with defaults to the store and parses dates", async () => {
    let seen: unknown;
    const store: ExampleStore = {
      dimensions: 3,
      findExamples: async (parsed) => {
        seen = parsed;
        return [
          {
            task: "tags",
            key: "post_9",
            input: "text",
            output: { tags: ["Billing"] },
            similarity: 0.9,
            decidedAt: "2026-11-01T00:00:00Z",
          },
        ];
      },
    };
    const [example] = await findExamples(store, query());
    expect(seen).toMatchObject({ excludeKeys: [], limit: 20 });
    expect(example!.decidedAt).toBeInstanceOf(Date);
  });
});
