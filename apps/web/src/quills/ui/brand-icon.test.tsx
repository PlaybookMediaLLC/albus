import { describe, expect, it } from "vite-plus/test";
import { renderComponent } from "../test/render";
import { BrandIcon } from "./brand-icon";

describe("BrandIcon", () => {
  it("draws a one-color mark in its brand color", () => {
    const view = renderComponent(<BrandIcon id="linkedin" />);
    const svg = view.container.querySelector("svg[data-brand=linkedin]");
    expect(svg).toHaveAttribute("fill", "#0A66C2");
    expect(svg).toHaveAttribute("aria-hidden", "true");
  });

  it("draws a black mark in the text color and a multi-color mark per path", () => {
    const x = renderComponent(<BrandIcon id="x" />);
    expect(x.container.querySelector("svg")).toHaveAttribute(
      "fill",
      "currentColor",
    );
    x.unmount();
    const slack = renderComponent(<BrandIcon id="slack" />);
    const fills = [...slack.container.querySelectorAll("path")].map((path) =>
      path.getAttribute("fill"),
    );
    expect(fills).toEqual(["#e01e5a", "#36c5f0", "#2eb67d", "#ecb22e"]);
  });

  it("draws nothing for a provider without a mark", () => {
    const view = renderComponent(<BrandIcon id="freshdesk" />);
    expect(view.container.querySelector("svg")).toBeNull();
  });
});
