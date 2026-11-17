import { describe, expect, it, vi } from "vite-plus/test";
import { choose } from "../../../test/actions";
import { renderComponent } from "../../../test/render";
import { BoardPicker } from "./board-picker";

const boards = [
  { id: "board_ideas", name: "Ideas" },
  { id: "board_bugs", name: "Bugs" },
];

describe("BoardPicker", () => {
  it("shows the chosen board and reports another choice", async () => {
    const onChange = vi.fn();
    const view = renderComponent(
      <BoardPicker boards={boards} value="board_ideas" onChange={onChange} />,
    );
    expect(view.getByRole("combobox", { name: "Board" })).toHaveTextContent(
      "Ideas",
    );
    await choose("Board", "Bugs");
    expect(onChange).toHaveBeenCalledWith("board_bugs");
  });
});
