import { fireEvent } from "@testing-library/react";
import { describe, expect, it, vi } from "vite-plus/test";
import { press } from "../../../test/actions";
import { renderComponent } from "../../../test/render";
import { RoadmapToolbar, type RoadmapToolbarProps } from "./roadmap-toolbar";

const render = (props: Partial<RoadmapToolbarProps> = {}) =>
  renderComponent(
    <RoadmapToolbar
      view="all"
      tabs={[
        { value: "active", label: "Active", count: 3 },
        { value: "all", label: "All", count: 5 },
      ]}
      onView={vi.fn()}
      board={null}
      onClearBoard={vi.fn()}
      display={{ board: true, author: true, counts: true, created: true }}
      onDisplay={vi.fn()}
      publicHref="/portal/workspace_test_1/roadmap"
      {...props}
    />,
  );

describe("RoadmapToolbar", () => {
  it("switches tabs, links the public roadmap and opens Display", () => {
    const onView = vi.fn();
    const view = render({ onView });
    fireEvent.click(view.getByRole("tab", { name: "Active 3" }));
    expect(onView).toHaveBeenCalledWith("active");
    expect(view.getByRole("link", { name: "Public roadmap" })).toHaveAttribute(
      "href",
      "/portal/workspace_test_1/roadmap",
    );
    expect(view.getByRole("button", { name: "Display options" })).toBeVisible();
  });

  it("shows the board filter as a chip that clears it", () => {
    const onClearBoard = vi.fn();
    const view = render({
      board: { id: "board_ideas", name: "Ideas" },
      onClearBoard,
    });
    press("Clear the Ideas filter");
    expect(onClearBoard).toHaveBeenCalledOnce();
    expect(view.getByText("Ideas")).toBeVisible();
  });
});
