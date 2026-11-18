import { describe, expect, it } from "vite-plus/test";
import { renderComponent } from "../../test/render";
import { AutopilotArt } from "./autopilot-art";

describe("AutopilotArt", () => {
  it("draws decorative layers hidden from screen readers, under 2KB", () => {
    const view = renderComponent(<AutopilotArt />);
    const svg = view.container.querySelector("svg");
    expect(svg).toHaveAttribute("aria-hidden", "true");
    expect(svg?.querySelectorAll(":scope > g").length).toBeGreaterThan(1);
    expect(view.container.innerHTML.length).toBeLessThan(2048);
  });
});
