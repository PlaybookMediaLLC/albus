import { describe, expect, it } from "vite-plus/test";
import { effective, withCell } from "./notification-cells";

const prefs = {
  emailStatusChange: false,
  emailNewComment: true,
  matrix: [
    { type: "post_status_changed", inApp: false, email: null, push: null },
    { type: "weekly_digest", inApp: null, email: false, push: null },
  ],
};

describe("effective", () => {
  it("uses the matrix cell, else the legacy mail flag, else on", () => {
    expect(effective(prefs, "post_status_changed", "inApp")).toBe(false);
    expect(effective(prefs, "post_status_changed", "email")).toBe(false);
    expect(effective(prefs, "comment_created", "inApp")).toBe(true);
    expect(effective(prefs, "comment_created", "email")).toBe(true);
    const cell = { type: "comment_created", email: false };
    expect(
      effective({ ...prefs, matrix: [cell] }, "comment_created", "email"),
    ).toBe(false);
  });
});

describe("withCell", () => {
  it("changes one cell and keeps the other cells without nulls", () => {
    expect(
      withCell(prefs.matrix, "post_status_changed", "email", true),
    ).toEqual([
      { type: "post_status_changed", inApp: false, email: true },
      { type: "weekly_digest", email: false },
    ]);
  });

  it("adds a type that has no cell", () => {
    expect(withCell(prefs.matrix, "comment_created", "inApp", false)).toEqual([
      { type: "post_status_changed", inApp: false },
      { type: "weekly_digest", email: false },
      { type: "comment_created", inApp: false },
    ]);
  });
});
