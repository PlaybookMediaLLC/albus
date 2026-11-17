import { describe, expect, it } from "vite-plus/test";
import { formatFieldValue } from "./custom-field-value";

const labels = { yes: "Yes", no: "No" };
const one = (value: string | number | boolean) => ({ value, values: null });

describe("formatFieldValue", () => {
  it("formats each stored type", () => {
    expect(formatFieldValue(one(true), labels, "en-US")).toBe("Yes");
    expect(formatFieldValue(one(false), labels, "en-US")).toBe("No");
    expect(formatFieldValue(one(1234.5), labels, "en-US")).toBe("1,234.5");
    expect(
      formatFieldValue({ value: null, values: ["API", "UI"] }, labels, "en-US"),
    ).toBe("API, UI");
    expect(formatFieldValue(one("2026-02-28"), labels, "en-US")).toBe(
      "2026-02-28",
    );
  });
});
