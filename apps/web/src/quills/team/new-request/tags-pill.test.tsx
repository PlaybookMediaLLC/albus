import { fireEvent } from "@testing-library/react";
import { describe, expect, it, vi } from "vite-plus/test";
import { renderComponent } from "../../test/render";
import { inboxTags } from "../../pages/team-posts/inbox.fixture";
import { TagsPill } from "./tags-pill";

describe("TagsPill", () => {
  it("checks the chosen tags and adds or removes a tag", async () => {
    const onChange = vi.fn();
    const view = renderComponent(
      <TagsPill
        tags={inboxTags.tags}
        value={["tag_api"]}
        onChange={onChange}
      />,
    );
    fireEvent.click(view.getByRole("button", { name: "1 tag" }));
    const api = await view.findByRole("menuitemcheckbox", { name: "API" });
    expect(api).toHaveAttribute("aria-checked", "true");
    fireEvent.click(view.getByRole("menuitemcheckbox", { name: "UX" }));
    expect(onChange).toHaveBeenLastCalledWith(["tag_api", "tag_ux"]);
    fireEvent.click(api);
    expect(onChange).toHaveBeenLastCalledWith([]);
  });

  it("says when the workspace has no tags", async () => {
    const view = renderComponent(
      <TagsPill tags={[]} value={[]} onChange={vi.fn()} />,
    );
    fireEvent.click(view.getByRole("button", { name: "Tags" }));
    expect(
      await view.findByText("No tags in this workspace"),
    ).toBeInTheDocument();
  });
});
