import { describe, expect, it } from "vite-plus/test";
import { shouldCollapse } from "./composer-collapse";

const box = (details: string) => {
  const div = document.createElement("div");
  const area = document.createElement("textarea");
  area.value = details;
  const button = document.createElement("button");
  div.append(area, button);
  return { div, button };
};

describe("shouldCollapse", () => {
  it("folds an empty composer when focus leaves it", () => {
    expect(shouldCollapse(box("").div, null, "")).toBe(true);
  });

  it("stays open with a title, with details, or while focus stays inside", () => {
    expect(shouldCollapse(box("").div, null, "CSV")).toBe(false);
    expect(shouldCollapse(box("I need CSV exports").div, null, "")).toBe(false);
    const { div, button } = box("");
    expect(shouldCollapse(div, button, "")).toBe(false);
  });
});
