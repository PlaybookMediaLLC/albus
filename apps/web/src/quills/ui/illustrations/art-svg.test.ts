import { describe, expect, it } from "vite-plus/test";
import { artSvg } from "./art-svg";

describe("artSvg", () => {
  it("frames a decorative 96×80 line drawing in the text colour with the art motion", () => {
    expect(artSvg).toMatchObject({
      viewBox: "0 0 96 80",
      stroke: "currentColor",
      fill: "none",
      "aria-hidden": true,
      focusable: false,
    });
    expect(artSvg.className.split(" ")).toContain("art");
  });
});
