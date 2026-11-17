import { describe, expect, it } from "vite-plus/test";
import { boardTone } from "../../core/board-color";
import { renderComponent } from "../../test/render";
import { BoardDot } from "./board-dot";

describe("BoardDot", () => {
  it("uses the board tone, or the text color without a board", () => {
    const view = renderComponent(
      <>
        <BoardDot boardId="board_ideas" />
        <BoardDot />
      </>,
    );
    const [toned, plain] = view.container.querySelectorAll("span");
    expect(toned).toHaveClass(boardTone("board_ideas"));
    expect(toned).toHaveAttribute("aria-hidden", "true");
    expect(plain).toHaveClass("bg-current");
  });
});
