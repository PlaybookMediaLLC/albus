import { afterEach, describe, expect, it, vi } from "vite-plus/test";
import { traitInput, traitText } from "./trait-value";

describe("traitText", () => {
  afterEach(() => vi.unstubAllEnvs());
  it("shows the stored day of a date west of UTC", () => {
    vi.stubEnv("TZ", "America/Los_Angeles");
    expect(traitText("2026-03-01T00:00:00.000Z", "date", "en-US")).toBe(
      "Mar 1, 2026",
    );
  });
  it("shows each type in the locale", () => {
    expect(traitText(1200, "number", "en-US")).toBe("1,200");
    expect(traitText(12, "currency", "en-US", "USD")).toBe("$12.00");
    expect(traitText("2026-03-01T00:00:00.000Z", "date", "en-US")).toMatch(
      /2026/,
    );
    expect(traitText("not a date", "date", "en-US")).toBe("not a date");
    expect(traitText("Pro", undefined, "en-US")).toBe("Pro");
  });
});

describe("traitInput", () => {
  it("coerces the field text to the definition type", () => {
    expect(traitInput("true", "boolean")).toBe(true);
    expect(traitInput("false", "boolean")).toBe(false);
    expect(traitInput(" 42 ", "number")).toBe(42);
    expect(traitInput("abc", "currency")).toBeUndefined();
    expect(traitInput("", "string")).toBeUndefined();
    expect(traitInput("2026-03-01", "date")).toBe("2026-03-01T00:00:00.000Z");
    expect(traitInput("someday", "date")).toBeUndefined();
    expect(traitInput(" Pro ", "string")).toBe("Pro");
  });
});
