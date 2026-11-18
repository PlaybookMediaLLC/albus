import { describe, expect, it } from "vite-plus/test";
import { selectExamples } from "./select.js";
import type { Example } from "./types.js";

const dup = (
  key: string,
  duplicate: boolean,
  similarity: number,
  day: number,
): Example => ({
  task: "duplicate",
  key,
  input: `first: ${key}\nsecond: ${key}`,
  output: { duplicate },
  similarity,
  decidedAt: new Date(Date.UTC(2026, 9, day)),
});

const isDuplicate = (example: Example) =>
  "duplicate" in example.output && example.output.duplicate;

describe("selectExamples", () => {
  it("matches the worked example of the design issue (section 8.4), by similarity only", () => {
    const picked = selectExamples(
      [
        dup("s1", true, 0.93, 2),
        dup("s2", true, 0.91, 9),
        dup("s3", true, 0.9, 32),
        dup("s4", false, 0.88, 20),
        dup("s5", false, 0.8, 34),
        dup("s6", true, 0.7, 35),
      ],
      { k: 4, maxSameAnswer: 2, freshnessWeight: 0 },
    );
    expect(picked.map((example) => example.key)).toEqual([
      "s5",
      "s4",
      "s2",
      "s1",
    ]);
  });

  it("caps the majority answer even when the minority answer comes first", () => {
    const picked = selectExamples(
      [
        dup("no", false, 0.82, 30),
        ...[1, 2, 3, 4, 5].map((i) => dup(`yes${i}`, true, 0.82, i)),
      ],
      { k: 4, maxSameAnswer: 2 },
    );
    expect(picked.filter((example) => isDuplicate(example))).toHaveLength(2);
    expect(picked.filter((example) => !isDuplicate(example))).toHaveLength(1);
  });

  it("fills k from one answer when the other answer has no candidates", () => {
    const picked = selectExamples(
      [
        dup("a", true, 0.95, 1),
        dup("b", true, 0.94, 1),
        dup("c", true, 0.93, 1),
      ],
      { k: 3, maxSameAnswer: 2 },
    );
    expect(picked).toHaveLength(3);
  });

  it("drops candidates under the threshold", () => {
    expect(
      selectExamples([dup("a", true, 0.77, 1)], { k: 4, minSimilarity: 0.78 }),
    ).toEqual([]);
  });

  it("keeps the higher similarity for a repeated key", () => {
    const [only] = selectExamples(
      [dup("a", true, 0.8, 1), dup("a", true, 0.9, 1)],
      { k: 4 },
    );
    expect(only!.similarity).toBe(0.9);
  });

  it("breaks a similarity tie with the newer decision", () => {
    const picked = selectExamples(
      [dup("old", true, 0.9, 1), dup("new", true, 0.9, 20)],
      { k: 1 },
    );
    expect(picked[0]!.key).toBe("new");
  });

  it("cuts each input and stops before the total cap", () => {
    const long = (key: string) => ({
      ...dup(key, true, 0.9, 1),
      input: "word ".repeat(200),
    });
    const picked = selectExamples([long("a"), long("b"), long("c")], {
      k: 4,
      maxCharsPerExample: 500,
      maxCharsTotal: 1200,
    });
    expect(picked).toHaveLength(2);
    for (const example of picked) {
      expect(example.input.length).toBeLessThanOrEqual(500);
      expect(example.input.endsWith("…")).toBe(true);
    }
  });

  it("returns nothing for k = 0 and for no candidates", () => {
    expect(selectExamples([dup("a", true, 0.9, 1)], { k: 0 })).toEqual([]);
    expect(selectExamples([], { k: 4 })).toEqual([]);
  });

  it("does not change the candidates it receives", () => {
    const candidates = [dup("a", true, 0.9, 1)];
    const before = structuredClone(candidates);
    selectExamples(candidates, { k: 4, maxCharsPerExample: 50 });
    expect(candidates).toEqual(before);
  });
  it("lets a recent decision beat a slightly closer old one, and only when freshness counts", () => {
    const now = new Date(Date.UTC(2026, 10, 17));
    const old = {
      ...dup("old", true, 0.9, 1),
      decidedAt: new Date(Date.UTC(2025, 10, 17)),
    };
    const recent = {
      ...dup("recent", true, 0.86, 1),
      decidedAt: new Date(Date.UTC(2026, 10, 16)),
    };
    expect(selectExamples([old, recent], { k: 1, now })[0]!.key).toBe("recent");
    expect(
      selectExamples([old, recent], { k: 1, now, freshnessWeight: 0 })[0]!.key,
    ).toBe("old");
  });

  it("never lets freshness pull in a candidate under the threshold", () => {
    const now = new Date(Date.UTC(2026, 10, 17));
    const fresh = { ...dup("fresh", true, 0.7, 1), decidedAt: now };
    expect(selectExamples([fresh], { k: 4, now, freshnessWeight: 1 })).toEqual(
      [],
    );
  });

  it("halves freshness at the half-life", () => {
    const now = new Date(Date.UTC(2026, 10, 17));
    const at = (daysAgo: number, key: string, similarity: number) => ({
      ...dup(key, true, similarity, 1),
      decidedAt: new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000),
    });
    // Freshness only: today scores 1, 90 days ago 0.5, 270 days ago 0.25.
    const picked = selectExamples(
      [at(270, "a", 0.9), at(90, "b", 0.9), at(0, "c", 0.9)],
      {
        k: 3,
        now,
        freshnessWeight: 1,
      },
    );
    expect(picked.map((example) => example.key)).toEqual(["a", "b", "c"]);
  });
});
