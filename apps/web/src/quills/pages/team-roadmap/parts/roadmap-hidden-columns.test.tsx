import { fireEvent } from "@testing-library/react";
import { describe, expect, it } from "vite-plus/test";
import { renderComponent } from "../../../test/render";
import { RoadmapHiddenColumns } from "./roadmap-hidden-columns";

describe("RoadmapHiddenColumns", () => {
  it("lists the hidden columns and folds the list away", () => {
    const view = renderComponent(
      <RoadmapHiddenColumns>
        <p>Done</p>
      </RoadmapHiddenColumns>,
    );
    const toggle = view.getByRole("button", { name: "Hidden columns" });
    expect(toggle).toHaveAttribute("aria-expanded", "true");
    expect(view.getByText("Done")).toBeVisible();
    fireEvent.click(toggle);
    expect(toggle).toHaveAttribute("aria-expanded", "false");
    expect(view.queryByText("Done")).toBeNull();
  });
});
