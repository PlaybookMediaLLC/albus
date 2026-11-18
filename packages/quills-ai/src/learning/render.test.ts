import { describe, expect, it, vi } from "vite-plus/test";
import { renderExamples } from "./render.js";
import type { Example } from "./types.js";

const tag = (key: string, input: string, tags: string[]): Example => ({
  task: "tags",
  key,
  input,
  output: { tags },
  similarity: 0.9,
  decidedAt: new Date(),
});

describe("renderExamples", () => {
  it("returns null when there is no example", () => {
    expect(renderExamples("duplicate", [], (_, text) => text)).toBeNull();
  });

  it("wraps each example under a numbered label and adds the answer line", () => {
    const wrap = vi.fn(
      (label: string, text: string) => `<${label}>${text}</${label}>`,
    );
    const message = renderExamples(
      "tags",
      [
        tag("p1", "Invoices lack VAT", ["Billing", "Invoices"]),
        tag("p2", "CSV export", ["Export"]),
      ],
      wrap,
    );
    expect(wrap).toHaveBeenNthCalledWith(1, "example_1", "Invoices lack VAT");
    expect(wrap).toHaveBeenNthCalledWith(2, "example_2", "CSV export");
    expect(message).toEqual(
      [
        "Posts that this team tagged by hand. Use them to match the team's tagging habits.",
        "<example_1>Invoices lack VAT</example_1>\nTeam tags: Billing, Invoices",
        "<example_2>CSV export</example_2>\nTeam tags: Export",
      ].join("\n\n"),
    );
  });

  it("writes the teammate's duplicate decision in words", () => {
    const pair = (duplicate: boolean): Example => ({
      task: "duplicate",
      key: `s${duplicate}`,
      input: "first: a\nsecond: b",
      output: { duplicate },
      similarity: 0.9,
      decidedAt: new Date(),
    });
    const content = renderExamples(
      "duplicate",
      [pair(true), pair(false)],
      (l, t) => `[${l}]${t}`,
    )!;
    expect(content).toContain(
      "[example_1]first: a\nsecond: b\nTeam decision: duplicate",
    );
    expect(content).toContain(
      "[example_2]first: a\nsecond: b\nTeam decision: not duplicate",
    );
  });
});
