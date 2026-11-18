import { fireEvent } from "@testing-library/react";
import { describe, expect, it, vi } from "vite-plus/test";
import { press } from "../../../test/actions";
import { renderComponent } from "../../../test/render";
import { KnowledgeList } from "./knowledge-list";

describe("KnowledgeList", () => {
  it("shows the heading, the status filter, the last result and the list", async () => {
    const onStatusChange = vi.fn();
    const view = renderComponent(
      <KnowledgeList
        status="open"
        onStatusChange={onStatusChange}
        message="The draft is saved."
      >
        <p>Rows</p>
      </KnowledgeList>,
    );
    expect(
      view.getByRole("heading", { level: 1, name: "Knowledge to review" }),
    ).toBeInTheDocument();
    expect(view.getByRole("status")).toHaveTextContent("The draft is saved.");
    expect(view.getByText("Rows")).toBeInTheDocument();
    press("Filters");
    expect(
      await view.findByRole("menuitemradio", { name: "To review" }),
    ).toHaveAttribute("aria-checked", "true");
    fireEvent.click(view.getByRole("menuitemradio", { name: "Approved" }));
    expect(onStatusChange).toHaveBeenCalledWith("approved");
  });

  it("names the view of the dismissed suggestions", () => {
    const view = renderComponent(
      <KnowledgeList
        status="dismissed"
        onStatusChange={() => undefined}
        message=""
      >
        {null}
      </KnowledgeList>,
    );
    expect(
      view.getByRole("heading", { level: 1, name: "Dismissed knowledge" }),
    ).toBeInTheDocument();
  });
});
