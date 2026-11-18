import { fireEvent } from "@testing-library/react";
import { describe, expect, it, vi } from "vite-plus/test";
import { press } from "../../test/actions";
import { renderComponent } from "../../test/render";
import { MenuItem, ShortcutListener } from "../upstream";
import { TeamHeaderContext } from "../../team/header-context";
import { ListHeader } from "./list-header";

describe("ListHeader", () => {
  it("shows the heading and runs the filter handler by button and by key", () => {
    const onFilters = vi.fn();
    const view = renderComponent(
      <>
        <ShortcutListener />
        <ListHeader title="Requests" onFilters={onFilters} />
      </>,
    );
    expect(
      view.getByRole("heading", { level: 1, name: "Requests" }),
    ).toBeInTheDocument();
    expect(view.getByRole("button", { name: "Filters" })).toHaveAttribute(
      "aria-keyshortcuts",
      "F",
    );
    press("Filters");
    fireEvent.keyDown(document.body, { key: "f", code: "KeyF" });
    expect(onFilters).toHaveBeenCalledTimes(2);
  });

  it("opens the filter menu with F", async () => {
    const view = renderComponent(
      <>
        <ShortcutListener />
        <ListHeader
          title="Open"
          filters={<MenuItem onClick={() => undefined}>Snoozed</MenuItem>}
        />
      </>,
    );
    fireEvent.keyDown(document.body, { key: "f", code: "KeyF" });
    expect(
      await view.findByRole("menuitem", { name: "Snoozed" }),
    ).toBeInTheDocument();
  });

  it("leaves out the filter button without filters and shows extra actions", () => {
    const view = renderComponent(
      <ListHeader
        title="Tickets"
        headingLevel={2}
        actions={<button type="button">New</button>}
      />,
    );
    expect(
      view.getByRole("heading", { level: 2, name: "Tickets" }),
    ).toBeVisible();
    expect(view.queryByRole("button", { name: "Filters" })).toBeNull();
    expect(view.getByRole("button", { name: "New" })).toBeInTheDocument();
  });

  it("shows the section breadcrumb and stars the page in the team shell", () => {
    const onFavorite = vi.fn();
    const view = renderComponent(
      <TeamHeaderContext.Provider
        value={{ section: "Workspace", favorite: false, onFavorite }}
      >
        <ListHeader title="Roadmap" />
        <ListHeader title="Beside an item" headingLevel={2} />
      </TeamHeaderContext.Provider>,
    );
    expect(view.getByText("Workspace")).toBeVisible();
    const star = view.getByRole("button", { name: "Add to favorites" });
    expect(star).toHaveAttribute("aria-pressed", "false");
    fireEvent.click(star);
    expect(onFavorite).toHaveBeenCalledWith("Roadmap");
    // Only the page title gets the star.
    expect(
      view.getAllByRole("button", { name: "Add to favorites" }),
    ).toHaveLength(1);
  });

  it("names the star by its state and leaves out a breadcrumb equal to the title", () => {
    const view = renderComponent(
      <TeamHeaderContext.Provider
        value={{ section: "Requests", favorite: true, onFavorite: vi.fn() }}
      >
        <ListHeader title="Requests" />
      </TeamHeaderContext.Provider>,
    );
    expect(view.getAllByText("Requests")).toHaveLength(1);
    expect(
      view.getByRole("button", { name: "Remove from favorites" }),
    ).toHaveAttribute("aria-pressed", "true");
  });
});
