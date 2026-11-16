import { describe, expect, it } from "vite-plus/test";
import { commentVoteEmoji, reactionEmoji } from "./reactions";

describe("reactions", () => {
  it("counts the comment vote among the reactions that the API accepts", () => {
    expect(reactionEmoji).toContain(commentVoteEmoji);
    expect(new Set(reactionEmoji).size).toBe(reactionEmoji.length);
  });
});
