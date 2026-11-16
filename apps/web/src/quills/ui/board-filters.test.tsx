import { fireEvent } from "@testing-library/react";
import { expect, it, vi } from "vite-plus/test";
import { choose } from "../test/actions";
import { renderComponent } from "../test/render";
import { BoardFilters } from "./board-filters";

const boards = [
  { id: "board_1", name: "Ideas" },
  { id: "board_2", name: "Bugs" },
];

it("names the current board and links every board", async () => {
  const view = renderComponent(
    <BoardFilters
      workspaceId="workspace_1"
      boardId="board_2"
      boards={boards}
    />,
  );
  const trigger = view.getByRole("button", { name: "Boards" });
  expect(trigger).toHaveTextContent("Bugs");
  fireEvent.click(trigger);
  expect(
    await view.findByRole("menuitem", { name: "All feedback" }),
  ).toHaveAttribute("href", "/portal/workspace_1");
  expect(view.getByRole("menuitem", { name: "Bugs" })).toHaveAttribute(
    "aria-current",
    "page",
  );
});

it("filters by one status and clears it with any status", async () => {
  const onStageChange = vi.fn();
  const view = renderComponent(
    <BoardFilters
      workspaceId="workspace_1"
      boards={boards}
      stages={[{ value: "planned", label: "Planned", color: null }]}
      stage="planned"
      onStageChange={onStageChange}
    />,
  );
  expect(view.getByRole("button", { name: "Boards" })).toHaveTextContent(
    "All feedback",
  );
  await choose("Status", "Any status");
  expect(onStageChange).toHaveBeenCalledWith("");
});
