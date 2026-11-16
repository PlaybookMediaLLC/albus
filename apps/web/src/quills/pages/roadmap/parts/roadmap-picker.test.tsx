import { describe, expect, it, vi } from "vite-plus/test";
import { press } from "../../../test/actions";
import { renderComponent } from "../../../test/render";
import { RoadmapPicker } from "./roadmap-picker";

const roadmaps = [
  { id: "roadmap_test_1", slug: "product", name: "Product" },
  { id: "roadmap_test_2", slug: "platform", name: "Platform" },
];

describe("RoadmapPicker", () => {
  it("names the group and marks the selected roadmap", () => {
    const view = renderComponent(
      <RoadmapPicker
        roadmaps={roadmaps}
        selected="product"
        onSelect={vi.fn()}
      />,
    );
    expect(view.getByRole("group", { name: "Roadmaps" })).toBeInTheDocument();
    expect(view.getByRole("button", { name: "Product" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(view.getByRole("button", { name: "Platform" })).toHaveAttribute(
      "aria-pressed",
      "false",
    );
  });

  it("selects another roadmap and ignores a press on the selected one", () => {
    const onSelect = vi.fn();
    renderComponent(
      <RoadmapPicker
        roadmaps={roadmaps}
        selected="product"
        onSelect={onSelect}
      />,
    );
    press("Platform");
    expect(onSelect).toHaveBeenCalledWith("platform");
    onSelect.mockClear();
    press("Product");
    expect(onSelect).not.toHaveBeenCalled();
  });
});
