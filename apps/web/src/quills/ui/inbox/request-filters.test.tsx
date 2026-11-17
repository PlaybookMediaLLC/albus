import { fireEvent } from "@testing-library/react";
import { describe, expect, it, vi } from "vite-plus/test";
import { renderComponent } from "../../test/render";
import { ListHeader } from "./list-header";
import { RequestFilters, type RequestFiltersProps } from "./request-filters";

const render = (props: Partial<RequestFiltersProps> = {}) => {
  const all: RequestFiltersProps = {
    boards: [
      { id: "board_ideas", label: "Ideas" },
      { id: "board_bugs", label: "Bugs" },
    ],
    statuses: [
      { id: "status_open", label: "Open" },
      { id: "status_planned", label: "Planned" },
    ],
    tags: [{ id: "tag_api", label: "API" }],
    checked: { board: ["board_ideas"], status: ["status_open"], tags: [] },
    sort: "votes",
    onFacet: vi.fn(),
    onSort: vi.fn(),
    onClear: vi.fn(),
    ...props,
  };
  const view = renderComponent(
    <ListHeader title="Requests" filters={<RequestFilters {...all} />} />,
  );
  fireEvent.click(view.getByRole("button", { name: "Filters" }));
  return { view, props: all };
};
const open = async (view: ReturnType<typeof render>["view"], name: string) =>
  fireEvent.click(await view.findByRole("menuitem", { name }));

describe("RequestFilters", () => {
  it("checks the chosen boards and adds one", async () => {
    const { view, props } = render();
    await open(view, "Boards");
    expect(
      await view.findByRole("menuitemcheckbox", { name: "Ideas" }),
    ).toHaveAttribute("aria-checked", "true");
    fireEvent.click(view.getByRole("menuitemcheckbox", { name: "Bugs" }));
    expect(props.onFacet).toHaveBeenCalledWith("board", [
      "board_ideas",
      "board_bugs",
    ]);
  });

  it("selects every status", async () => {
    const { view, props } = render();
    await open(view, "Status");
    fireEvent.click(await view.findByRole("menuitem", { name: "Select all" }));
    expect(props.onFacet).toHaveBeenCalledWith("status", [
      "status_open",
      "status_planned",
    ]);
  });

  it("keeps the last checked board", async () => {
    const { view } = render();
    await open(view, "Boards");
    expect(
      await view.findByRole("menuitemcheckbox", { name: "Ideas" }),
    ).toHaveAttribute("aria-disabled", "true");
  });

  it("keeps the last checked status", async () => {
    const { view } = render();
    await open(view, "Status");
    expect(
      await view.findByRole("menuitemcheckbox", { name: "Open" }),
    ).toHaveAttribute("aria-disabled", "true");
  });

  it("checks the sort and reports a new one", async () => {
    const { view, props } = render();
    await open(view, "Sort");
    expect(
      await view.findByRole("menuitemradio", { name: "Top" }),
    ).toHaveAttribute("aria-checked", "true");
    fireEvent.click(view.getByRole("menuitemradio", { name: "Trending" }));
    expect(props.onSort).toHaveBeenCalledWith("trending");
  });

  it("offers Deleted, the saved views, Save as view and Clear only when asked", async () => {
    const onDeleted = vi.fn();
    const onView = vi.fn();
    const onSaveView = vi.fn();
    const { view, props } = render({
      deleted: false,
      onDeleted,
      views: [{ id: "view_big", name: "Big asks" }],
      onView,
      onSaveView,
    });
    await open(view, "Status");
    fireEvent.click(
      await view.findByRole("menuitemcheckbox", { name: "Deleted" }),
    );
    expect(onDeleted).toHaveBeenCalledWith(true);
    await open(view, "Views");
    fireEvent.click(await view.findByRole("menuitem", { name: "Big asks" }));
    expect(onView).toHaveBeenCalledWith("view_big");
    expect(props.onClear).not.toHaveBeenCalled();
  });

  it("leaves out Deleted, Views and Save as view by default, and clears", async () => {
    const { view, props } = render();
    fireEvent.click(await view.findByRole("menuitem", { name: "Clear" }));
    expect(props.onClear).toHaveBeenCalled();
    expect(view.queryByRole("menuitem", { name: "Save as view…" })).toBeNull();
    expect(view.queryByRole("menuitem", { name: "Views" })).toBeNull();
  });
});
