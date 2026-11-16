import { describe, expect, it } from "vite-plus/test";
import { clampListWidth, LIST_WIDTH, parseListWidth } from "./list-width";

describe("list width", () => {
  it("keeps the width in range and rounds it", () => {
    expect(clampListWidth(100)).toBe(LIST_WIDTH.min);
    expect(clampListWidth(900)).toBe(LIST_WIDTH.max);
    expect(clampListWidth(400.6)).toBe(401);
  });

  it("reads a stored width, or the default for a missing or bad value", () => {
    expect(parseListWidth(420)).toBe(420);
    expect(parseListWidth(9000)).toBe(LIST_WIDTH.max);
    expect(parseListWidth("wide")).toBe(LIST_WIDTH.initial);
    expect(parseListWidth(Number.NaN)).toBe(LIST_WIDTH.initial);
  });
});
