import { fireEvent } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vite-plus/test";
import { press } from "../../test/actions";
import { renderComponent } from "../../test/render";
import { DetailHeader } from "./detail-header";
import { DetailLayout } from "./detail-layout";
import { EmptySelection } from "./empty-selection";
import { ListPane } from "./list-pane";

function renderDetail(itemOpen = true) {
  return renderComponent(
    <DetailLayout
      list={
        <ListPane title="Open" headingLevel={2}>
          <p>Compact list</p>
        </ListPane>
      }
      listLabel="Conversations"
      itemOpen={itemOpen}
      properties={<p>Status: open</p>}
      propertiesLabel="Details"
    >
      <DetailHeader>
        <h1>Export fails</h1>
      </DetailHeader>
    </DetailLayout>,
  );
}

describe("DetailLayout", () => {
  afterEach(() => window.localStorage.clear());

  it("shows the list pane, the item and the right panel in named panes", () => {
    const view = renderDetail();
    expect(
      view.getByRole("region", { name: "Conversations" }),
    ).toHaveTextContent("Compact list");
    expect(view.getByRole("heading", { name: "Export fails" })).toBeVisible();
    expect(
      view.getByRole("complementary", { name: "Details" }),
    ).toHaveTextContent("Status: open");
  });

  it("hides the list pane and shows it again from the item header", () => {
    const view = renderDetail();
    expect(view.queryByRole("button", { name: "Show the list" })).toBeNull();
    press("Hide the list");
    expect(view.queryByRole("region", { name: "Conversations" })).toBeNull();
    const header = view.getByRole("heading", { name: "Export fails" })
      .parentElement!.parentElement!;
    expect(header).toContainElement(
      view.getByRole("button", { name: "Show the list" }),
    );
    press("Show the list");
    expect(view.getByRole("region", { name: "Conversations" })).toBeVisible();
  });

  it("shows the hidden list again from the empty main pane", () => {
    const view = renderComponent(
      <DetailLayout
        list={
          <ListPane title="Open" headingLevel={2}>
            <p>Compact list</p>
          </ListPane>
        }
        listLabel="Conversations"
        itemOpen={false}
      >
        <EmptySelection title="No conversation selected" />
      </DetailLayout>,
    );
    press("Hide the list");
    press("Show the list");
    expect(view.getByRole("region", { name: "Conversations" })).toBeVisible();
  });

  it("resizes the list pane with the keys and keeps the width on this device", () => {
    const view = renderDetail();
    const handle = view.getByRole("separator", { name: "Resize the list" });
    const list = view.getByRole("region", { name: "Conversations" });
    expect(handle).toHaveAttribute("aria-controls", list.id);
    expect(handle).toHaveAttribute("aria-valuenow", "360");
    fireEvent.keyDown(handle, { key: "ArrowRight" });
    expect(handle).toHaveAttribute("aria-valuenow", "376");
    expect(list.style.getPropertyValue("--list-width")).toBe("376px");
    fireEvent.keyDown(handle, { key: "End" });
    expect(handle).toHaveAttribute("aria-valuenow", "520");
    view.unmount();
    expect(
      renderDetail().getByRole("separator", { name: "Resize the list" }),
    ).toHaveAttribute("aria-valuenow", "520");
  });

  it("toggles the right panel from the header on wide screens", () => {
    const view = renderDetail();
    const toggle = view.getByRole("button", { name: "Details" });
    expect(toggle).toHaveAttribute("aria-expanded", "true");
    press("Details");
    expect(view.queryByRole("complementary", { name: "Details" })).toBeNull();
    expect(toggle).toHaveAttribute("aria-expanded", "false");
  });

  it("opens the right panel in a sheet on small screens", async () => {
    vi.stubGlobal("matchMedia", () => ({ matches: false }));
    const view = renderDetail();
    press("Details");
    const sheet = await view.findByRole("dialog", { name: "Details" });
    expect(sheet).toHaveTextContent("Status: open");
    vi.unstubAllGlobals();
  });

  it("shows the list in place of the main pane on small screens while no item is open", () => {
    const view = renderDetail(false);
    expect(view.getByRole("region", { name: "Conversations" })).toHaveClass(
      "flex",
    );
  });
});
