import { fireEvent } from "@testing-library/react";
import { describe, expect, it, vi } from "vite-plus/test";
import { press } from "../../../test/actions";
import { renderComponent } from "../../../test/render";
import { RoadmapDisplayMenu } from "./roadmap-display-menu";

describe("RoadmapDisplayMenu", () => {
  it("lists the card details and toggles one", async () => {
    const onToggle = vi.fn();
    const view = renderComponent(
      <RoadmapDisplayMenu
        display={{ board: true, author: false, counts: true, created: true }}
        onToggle={onToggle}
      />,
    );
    press("Display options");
    const author = await view.findByRole("menuitemcheckbox", {
      name: "Author",
    });
    expect(author).toHaveAttribute("aria-checked", "false");
    expect(
      view.getByRole("menuitemcheckbox", { name: "Votes and comments" }),
    ).toHaveAttribute("aria-checked", "true");
    fireEvent.click(author);
    expect(onToggle).toHaveBeenCalledWith("author", true);
  });
});
