import { afterEach, describe, expect, it } from "vite-plus/test";
import {
  clampListWidth,
  LIST_WIDTH,
  readListWidth,
  writeListWidth,
} from "./list-width";

describe("list width", () => {
  afterEach(() => window.localStorage.clear());

  it("keeps the width in range and rounds it", () => {
    expect(clampListWidth(100)).toBe(LIST_WIDTH.min);
    expect(clampListWidth(900)).toBe(LIST_WIDTH.max);
    expect(clampListWidth(400.6)).toBe(401);
  });

  it("reads the stored width, or the default for a missing or bad value", () => {
    expect(readListWidth()).toBe(LIST_WIDTH.initial);
    writeListWidth(420);
    expect(readListWidth()).toBe(420);
    window.localStorage.setItem("quills.list-width", "wide");
    expect(readListWidth()).toBe(LIST_WIDTH.initial);
    window.localStorage.setItem("quills.list-width", "9000");
    expect(readListWidth()).toBe(LIST_WIDTH.max);
  });
});
