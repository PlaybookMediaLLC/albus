import { fireEvent } from "@testing-library/react";
import { describe, expect, it, vi } from "vite-plus/test";
import { renderComponent } from "../../test/render";
import { ListResizer } from "./list-resizer";

describe("ListResizer", () => {
  it("is a labeled splitter that the arrow keys, Home and End resize within range", () => {
    const onResize = vi.fn();
    const view = renderComponent(
      <ListResizer
        label="Resize the list"
        controls="list"
        width={300}
        onResize={onResize}
      />,
    );
    const handle = view.getByRole("separator", { name: "Resize the list" });
    expect(handle).toHaveAttribute("aria-valuenow", "300");
    expect(handle).toHaveAttribute("aria-valuemin", "280");
    expect(handle).toHaveAttribute("aria-valuemax", "520");
    fireEvent.keyDown(handle, { key: "ArrowRight" });
    fireEvent.keyDown(handle, { key: "ArrowLeft" });
    fireEvent.keyDown(handle, { key: "Home" });
    fireEvent.keyDown(handle, { key: "End" });
    fireEvent.keyDown(handle, { key: "a" });
    expect(onResize.mock.calls).toEqual([[316], [284], [280], [520]]);
  });
});
