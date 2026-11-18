import { describe, expect, it } from "vite-plus/test";
import { renderComponent } from "../../../test/render";
import { SocialLinks } from "./social-links";

describe("SocialLinks", () => {
  it("opens each network with the portal URL in a new tab", () => {
    const view = renderComponent(
      <SocialLinks workspace="Acme" url="https://feedback.acme.test" />,
    );
    const links = view.getAllByRole("link");
    expect(links).toHaveLength(4);
    for (const link of links) {
      expect(link).toHaveAttribute("target", "_blank");
      expect(link.getAttribute("href")).toContain("feedback.acme.test");
    }
    expect(view.getByRole("link", { name: /LinkedIn/ })).toBeInTheDocument();
    expect(
      [...view.container.querySelectorAll("svg[data-brand]")].map((svg) =>
        svg.getAttribute("data-brand"),
      ),
    ).toEqual(["x", "linkedin", "facebook", "reddit"]);
  });
});
