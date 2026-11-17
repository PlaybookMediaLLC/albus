import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vite-plus/test";
import { Popover, PopoverPopup } from "./popover";

function viewport(variant?: "panel" | "menu") {
  render(
    <Popover open>
      <PopoverPopup variant={variant}>Body</PopoverPopup>
    </Popover>,
  );
  return screen.getByText("Body").closest('[data-slot="popover-viewport"]');
}

describe("PopoverPopup", () => {
  afterEach(cleanup);

  it("pads its content by default", () => {
    expect(viewport()).toHaveClass("py-4");
  });

  it("keeps a menu close to the edge", () => {
    const element = viewport("menu");
    expect(element).toHaveClass("py-0.5");
    expect(element).not.toHaveClass("py-4");
  });
});
