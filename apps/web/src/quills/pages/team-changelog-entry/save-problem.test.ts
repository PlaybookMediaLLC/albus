import { describe, expect, it } from "vite-plus/test";
import { saveProblem } from "./save-problem";

describe("saveProblem", () => {
  it("names the API problem and keeps the first validation issue", () => {
    expect(saveProblem({ kind: "conflict" })).toEqual({
      key: "team-changelog.editor.problem.conflict",
      description: undefined,
    });
    expect(
      saveProblem({
        kind: "invalid",
        issues: [{ path: "title", message: "Too long" }],
      }),
    ).toEqual({
      key: "team-changelog.editor.problem.invalid",
      description: "Too long",
    });
    expect(saveProblem(new Error("offline")).key).toBe(
      "team-changelog.editor.saveFailed",
    );
  });
});
