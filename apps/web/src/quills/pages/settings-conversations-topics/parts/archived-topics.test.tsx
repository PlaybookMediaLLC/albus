import { fireEvent } from "@testing-library/react";
import { describe, expect, it, vi } from "vite-plus/test";
import { renderComponent } from "../../../test/render";
import { ArchivedTopics } from "./archived-topics";

const billing = { id: "tag_1", name: "Billing", color: "#3b82f6" };

describe("ArchivedTopics", () => {
  it("restores the topic that the user selects", () => {
    const onRestore = vi.fn();
    const view = renderComponent(
      <ArchivedTopics
        items={[billing]}
        pending={false}
        onRestore={onRestore}
      />,
    );
    expect(view.getByText("Archived topics")).toBeVisible();
    fireEvent.click(view.getByRole("button", { name: "Restore Billing" }));
    expect(onRestore).toHaveBeenCalledWith("tag_1");
  });

  it("turns the buttons off while a restore runs", () => {
    const view = renderComponent(
      <ArchivedTopics items={[billing]} pending onRestore={vi.fn()} />,
    );
    expect(
      view.getByRole("button", { name: "Restore Billing" }),
    ).toBeDisabled();
  });

  it("shows nothing without archived topics", () => {
    const view = renderComponent(
      <ArchivedTopics items={[]} pending={false} onRestore={vi.fn()} />,
    );
    expect(view.queryByText("Archived topics")).toBeNull();
  });
});
