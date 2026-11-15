import { describe, expect, it } from "vite-plus/test";
import { membersInput } from "./members-input";

describe("membersInput", () => {
  it("sends no empty search and pages by 50", () => {
    expect(membersInput("w1", "", 100)).toEqual({
      param: { workspaceId: "w1" },
      query: { offset: "100", limit: "50" },
    });
    expect(membersInput("w1", "ada", 0).query.search).toBe("ada");
  });
});
