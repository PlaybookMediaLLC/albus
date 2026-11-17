import { describe, expect, it } from "vite-plus/test";
import { boardTone } from "./board-color";

describe("boardTone", () => {
  it("gives one board the same tone every time, and boards different tones", () => {
    expect(boardTone("board_ideas")).toBe(boardTone("board_ideas"));
    expect(boardTone("board_ideas")).toMatch(/^bg-/);
    const ids = ["board_a", "board_b", "board_c", "board_d", "board_e"];
    expect(new Set(ids.map(boardTone)).size).toBeGreaterThan(1);
  });
});
