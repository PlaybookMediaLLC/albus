import { fireEvent } from "@testing-library/react";
import { describe, expect, it, vi } from "vite-plus/test";
import { renderComponent } from "../../../test/render";
import { Menu, MenuPopup, MenuTrigger } from "../../../ui/upstream";
import { RoadmapBoardFilter } from "./roadmap-board-filter";

describe("RoadmapBoardFilter", () => {
  it("offers every board with its count and picks one or all", async () => {
    const onChange = vi.fn();
    const view = renderComponent(
      <Menu defaultOpen>
        <MenuTrigger>Filters</MenuTrigger>
        <MenuPopup>
          <RoadmapBoardFilter
            boards={[{ id: "board_ideas", name: "Ideas" }]}
            counts={new Map([["board_ideas", 7]])}
            value="board_ideas"
            onChange={onChange}
          />
        </MenuPopup>
      </Menu>,
    );
    const ideas = await view.findByRole("menuitemradio", { name: /Ideas/ });
    expect(ideas).toHaveAttribute("aria-checked", "true");
    expect(ideas).toHaveTextContent("7");
    fireEvent.click(view.getByRole("menuitemradio", { name: "All boards" }));
    expect(onChange).toHaveBeenCalledWith(null);
  });
});
