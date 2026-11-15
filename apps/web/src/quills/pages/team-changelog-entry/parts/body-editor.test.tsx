import { fireEvent } from "@testing-library/react";
import { describe, expect, it, vi } from "vite-plus/test";
import { renderComponent } from "../../../test/render";
import { BodyEditor } from "./body-editor";

describe("BodyEditor", () => {
  it("edits the Markdown and previews it", () => {
    const onChange = vi.fn();
    const view = renderComponent(
      <BodyEditor value="## Fixed" onChange={onChange} />,
    );
    fireEvent.change(view.getByRole("textbox", { name: "Body" }), {
      target: { value: "## Fixed bugs" },
    });
    expect(onChange).toHaveBeenCalledWith("## Fixed bugs");
    fireEvent.click(view.getByRole("button", { name: "Preview" }));
    expect(
      view.getByRole("heading", { level: 2, name: "Fixed" }),
    ).toBeInTheDocument();
    expect(view.queryByRole("textbox")).toBeNull();
  });
});
