import { fireEvent } from "@testing-library/react";
import { describe, expect, it, vi } from "vite-plus/test";
import { renderComponent } from "../../test/render";
import { ListHeader } from "./list-header";
import { RequestFilters } from "./request-filters";

const render = (onChange = vi.fn()) =>
  renderComponent(
    <ListHeader
      title="Requests"
      filters={
        <RequestFilters
          status=""
          board="board_ideas"
          sort="votes"
          boards={[{ id: "board_ideas", name: "Ideas" }]}
          onChange={onChange}
        />
      }
    />,
  );

describe("RequestFilters", () => {
  it("checks the current board and sort, and no status group while one status shows", async () => {
    const view = render();
    fireEvent.click(view.getByRole("button", { name: "Filters" }));
    expect(
      await view.findByRole("menuitemradio", { name: "Ideas" }),
    ).toHaveAttribute("aria-checked", "true");
    expect(
      view.getByRole("menuitemradio", { name: "Most votes" }),
    ).toHaveAttribute("aria-checked", "true");
    expect(view.getByRole("menuitemradio", { name: "Open" })).toHaveAttribute(
      "aria-checked",
      "false",
    );
  });

  it("reports the chosen value with its group", async () => {
    const onChange = vi.fn();
    const view = render(onChange);
    fireEvent.click(view.getByRole("button", { name: "Filters" }));
    fireEvent.click(
      await view.findByRole("menuitemradio", { name: "All boards" }),
    );
    expect(onChange).toHaveBeenCalledWith("board", "");
  });

  it("offers the deleted requests only when asked", async () => {
    const view = render();
    fireEvent.click(view.getByRole("button", { name: "Filters" }));
    await view.findByRole("menuitemradio", { name: "Open" });
    expect(view.queryByRole("menuitemradio", { name: "Deleted" })).toBeNull();
    view.unmount();
    const onChange = vi.fn();
    const deleted = renderComponent(
      <ListHeader
        title="Requests"
        filters={
          <RequestFilters
            status="active"
            withDeleted
            board=""
            sort="newest"
            boards={[]}
            onChange={onChange}
          />
        }
      />,
    );
    fireEvent.click(deleted.getByRole("button", { name: "Filters" }));
    fireEvent.click(
      await deleted.findByRole("menuitemradio", { name: "Deleted" }),
    );
    expect(onChange).toHaveBeenCalledWith("status", "deleted");
  });
});
