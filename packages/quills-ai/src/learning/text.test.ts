import { describe, expect, it } from "vite-plus/test";
import { clip } from "./text.js";

describe("clip", () => {
  it("keeps short text, trimmed", () => {
    expect(clip("  short text  ", 50)).toBe("short text");
  });

  it("cuts at a word boundary and adds an ellipsis", () => {
    const out = clip("alpha beta gamma delta epsilon", 17);
    expect(out).toBe("alpha beta gamma…");
    expect(out.length).toBeLessThanOrEqual(17);
  });

  it("cuts inside a single long word", () => {
    const out = clip("x".repeat(40), 10);
    expect(out).toBe(`${"x".repeat(9)}…`);
  });
  it("goes back to the last space when the limit falls inside a word", () => {
    expect(clip("alpha beta gamma", 13)).toBe("alpha beta…");
  });
});
