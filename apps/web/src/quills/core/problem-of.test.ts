import { describe, expect, it } from "vite-plus/test";
import { problemOf } from "./problem-of";

describe("problemOf", () => {
  it("gives nothing for a write that worked and the problem of a write that failed", async () => {
    expect(await problemOf(Promise.resolve({ id: "tag_1" }))).toBeUndefined();
    expect(await problemOf(Promise.reject({ kind: "conflict" }))).toEqual({
      kind: "conflict",
    });
  });
});
