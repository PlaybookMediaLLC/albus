import { describe, expect, it } from "vite-plus/test";
import { renderComponent } from "../../test/render";
import { HeroOrbit } from "./hero-orbit";

describe("HeroOrbit", () => {
  it("draws a decorative orbit whose sphere uses its own gradient", () => {
    const view = renderComponent(
      <>
        <HeroOrbit />
        <HeroOrbit />
      </>,
    );
    const [first, second] = view.container.querySelectorAll("svg");
    expect(first).toHaveAttribute("aria-hidden", "true");
    const id = (svg: Element) => svg.querySelector("radialGradient")?.id;
    expect(id(first)).toBeTruthy();
    expect(id(first)).not.toBe(id(second));
    expect(first.querySelector("circle")).toHaveAttribute(
      "fill",
      `url(#${id(first)})`,
    );
  });
});
