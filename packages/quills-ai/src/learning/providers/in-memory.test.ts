import { describe, expect, it } from "vite-plus/test";
import { findExamples } from "../port.js";
import type { ExampleQuery } from "../types.js";
import { InMemoryExampleStore, type MemoryRow } from "./in-memory.js";

// The port contract of the README, checked against the reference store.

const at = (angle: number) => [Math.cos(angle), Math.sin(angle), 0];
const row = (key: string, over: Partial<MemoryRow> = {}): MemoryRow => ({
  scopeId: "ws_a",
  embeddingModel: "m1",
  boards: [{ id: "board_open", linked: false }],
  postKeys: [key],
  vectors: [at(0.1)],
  example: {
    task: "tags",
    key,
    input: `text of ${key}`,
    output: { tags: ["Billing"] },
    decidedAt: new Date(),
  },
  ...over,
});
const query = (over: Partial<ExampleQuery> = {}): ExampleQuery => ({
  task: "tags",
  scopeId: "ws_a",
  subjects: [{ key: "subject", embedding: at(0) }],
  embeddingModel: "m1",
  visibility: { boardIds: [], includeUnlinkedBoards: true },
  ...over,
});
const keys = async (store: InMemoryExampleStore, q: ExampleQuery = query()) =>
  (await findExamples(store, q)).map((example) => example.key);

describe("InMemoryExampleStore (port contract)", () => {
  it("never returns a row of another scope or another embedding model", async () => {
    const store = new InMemoryExampleStore(3, [
      row("mine"),
      row("other_scope", { scopeId: "ws_b" }),
      row("other_model", { embeddingModel: "m0" }),
    ]);
    expect(await keys(store)).toEqual(["mine"]);
  });

  it("returns only rows whose boards are all visible", async () => {
    const store = new InMemoryExampleStore(3, [
      row("open"),
      row("linked", { boards: [{ id: "board_linked", linked: true }] }),
      row("half", {
        boards: [
          { id: "board_open", linked: false },
          { id: "board_linked", linked: true },
        ],
      }),
      row("named", { boards: [{ id: "board_named", linked: true }] }),
    ]);
    expect(
      await keys(
        store,
        query({
          visibility: {
            boardIds: ["board_named"],
            includeUnlinkedBoards: true,
          },
        }),
      ),
    ).toEqual(["open", "named"]);
    expect(
      await keys(
        store,
        query({
          visibility: {
            boardIds: ["board_named"],
            includeUnlinkedBoards: false,
          },
        }),
      ),
    ).toEqual(["named"]);
  });

  it("uses the stored vector of the subject when the query has none", async () => {
    const stored = new Map([
      ["ws_a", new Map([["subject", { model: "m1", vector: at(0) }]])],
    ]);
    const store = new InMemoryExampleStore(3, [row("mine")], stored);
    expect(
      await keys(
        store,
        query({ subjects: [{ key: "subject", embedding: null }] }),
      ),
    ).toEqual(["mine"]);
    expect(
      await keys(
        store,
        query({ subjects: [{ key: "unknown", embedding: null }] }),
      ),
    ).toEqual([]);
    expect(
      await keys(
        store,
        query({
          subjects: [{ key: "subject", embedding: null }],
          embeddingModel: "m0",
        }),
      ),
    ).toEqual([]);
  });

  it("returns at most limit rows, nearest first, with the greater similarity of a pair", async () => {
    const store = new InMemoryExampleStore(3, [
      row("far", { vectors: [at(0.6)] }),
      row("near", { vectors: [at(0.05)] }),
      row("pair", {
        vectors: [at(1.2), at(0.2)],
        postKeys: ["pair_a", "pair_b"],
      }),
    ]);
    const found = await findExamples(store, query({ limit: 2 }));
    expect(found.map((example) => example.key)).toEqual(["near", "pair"]);
    expect(found[1]!.similarity).toBeCloseTo(Math.cos(0.2), 6);
  });

  it("never returns an excluded key or the subject itself", async () => {
    const store = new InMemoryExampleStore(3, [
      row("keep"),
      row("excluded"),
      row("subject"),
      row("pair", { postKeys: ["pair_a", "excluded"] }),
    ]);
    expect(await keys(store, query({ excludeKeys: ["excluded"] }))).toEqual([
      "keep",
    ]);
  });

  it("returns only rows of the query's task", async () => {
    const store = new InMemoryExampleStore(3, [
      row("tags"),
      row("dup", {
        example: {
          task: "duplicate",
          key: "dup",
          input: "first: a\nsecond: b",
          output: { duplicate: true },
          decidedAt: new Date(),
        },
      }),
    ]);
    expect(await keys(store)).toEqual(["tags"]);
  });

  it("ranks a row by its similarity to the closest of several subjects", async () => {
    const store = new InMemoryExampleStore(3, [
      row("near_second", { vectors: [at(1.0)] }),
    ]);
    const [example] = await findExamples(
      store,
      query({
        subjects: [
          { key: "first", embedding: at(0) },
          { key: "second", embedding: at(0.95) },
        ],
      }),
    );
    expect(example!.similarity).toBeCloseTo(Math.cos(0.05), 6);
    expect(
      await keys(
        new InMemoryExampleStore(3, [row("second")]),
        query({
          subjects: [
            { key: "first", embedding: at(0) },
            { key: "second", embedding: at(0) },
          ],
        }),
      ),
    ).toEqual([]);
  });
});
