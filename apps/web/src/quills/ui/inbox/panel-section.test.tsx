import { fireEvent } from "@testing-library/react";
import { describe, expect, it } from "vite-plus/test";
import { renderComponent } from "../../test/render";
import { PanelSection } from "./panel-section";

describe("PanelSection", () => {
  it("opens and closes its body from the heading, and keeps the action outside the toggle", () => {
    const view = renderComponent(
      <PanelSection title="Links" count={2} action={<button>Refresh</button>}>
        <p>Body</p>
      </PanelSection>,
    );
    const toggle = view.getByRole("button", { name: "Links 2" });
    expect(view.getByRole("heading", { level: 2, name: "Links 2" })).toBe(
      toggle.parentElement,
    );
    expect(toggle).toHaveAttribute("aria-expanded", "true");
    expect(view.getByText("Body")).toBeVisible();
    fireEvent.click(toggle);
    expect(toggle).toHaveAttribute("aria-expanded", "false");
    expect(view.getByText("Body")).not.toBeVisible();
    expect(view.getByRole("button", { name: "Refresh" })).toBeVisible();
  });
});
