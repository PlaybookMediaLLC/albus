import { describe, expect, it } from "vite-plus/test";
import { fromLocalInput, toLocalInput } from "./local-time";

describe("local time input", () => {
  it("round-trips a time through the input value", () => {
    const iso = "2026-11-20T09:30:00.000Z";
    const value = toLocalInput(iso);
    expect(value).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/);
    expect(fromLocalInput(value)).toBe(iso);
  });

  it("refuses an empty or bad value", () => {
    expect(fromLocalInput("")).toBeNull();
    expect(fromLocalInput("soon")).toBeNull();
  });
});
