import { describe, expect, it, vi } from "vite-plus/test";
import { press } from "../../test/actions";
import { renderComponent } from "../../test/render";
import { DetailPaneContext } from "./detail-pane-context";
import { ShowListButton } from "./show-list-button";

describe("ShowListButton", () => {
  it("shows the list again only while it is hidden", () => {
    const showList = vi.fn();
    const pane = (show: (() => void) | null) => (
      <DetailPaneContext.Provider
        value={{ hideList: () => undefined, showList: show, panel: null }}
      >
        <ShowListButton />
      </DetailPaneContext.Provider>
    );
    const view = renderComponent(pane(null));
    expect(view.queryByRole("button", { name: "Show the list" })).toBeNull();
    view.rerender(pane(showList));
    press("Show the list");
    expect(showList).toHaveBeenCalledOnce();
  });
});
