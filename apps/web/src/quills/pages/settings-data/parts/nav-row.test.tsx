import { fireEvent } from "@testing-library/react";
import { FileUp } from "lucide-react";
import { describe, expect, it, vi } from "vite-plus/test";
import { renderComponent } from "../../../test/render";
import { NavRow } from "./nav-row";

describe("NavRow", () => {
  it("is one button with the title and the text", () => {
    const onClick = vi.fn();
    const view = renderComponent(
      <NavRow
        icon={FileUp}
        title="Import"
        text="From a file"
        onClick={onClick}
      />,
    );
    fireEvent.click(view.getByRole("button", { name: /^Import/ }));
    expect(onClick).toHaveBeenCalledOnce();
  });
});
