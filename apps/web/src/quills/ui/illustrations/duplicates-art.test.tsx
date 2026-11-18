import { describe, expect, it } from "vite-plus/test";
import { renderComponent } from "../../test/render";
import { DuplicatesArt } from "./duplicates-art";

describe("DuplicatesArt", () => {
  it("draws decorative layers hidden from screen readers, under 2KB", () => {
    const view = renderComponent(<DuplicatesArt />);
    const svg = view.container.querySelector("svg");
    expect(svg).toHaveAttribute("aria-hidden", "true");
    expect(svg?.querySelectorAll(":scope > g").length).toBeGreaterThan(1);
    expect(view.container.innerHTML.length).toBeLessThan(2048);
  });
});
