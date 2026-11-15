import { fireEvent, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vite-plus/test";
import { renderComponent } from "../../../test/render";
import { SiteLinksCard } from "./site-links-card";

afterEach(() => vi.unstubAllGlobals());

describe("SiteLinksCard", () => {
  it("links each open area and copies one URL on each line", async () => {
    const writeText = vi.fn(async () => undefined);
    vi.stubGlobal("navigator", { clipboard: { writeText } });
    const links = [
      { area: "feedback" as const, url: "https://a.test" },
      { area: "changelog" as const, url: "https://a.test/changelog" },
    ];
    const view = renderComponent(
      <SiteLinksCard workspace="Acme" links={links} />,
    );
    expect(view.getByText("© Acme")).toBeInTheDocument();
    expect(view.getByRole("link", { name: "Changelog" })).toHaveAttribute(
      "href",
      "https://a.test/changelog",
    );
    expect(view.queryByRole("link", { name: "Roadmap" })).toBeNull();
    fireEvent.click(view.getByRole("button", { name: "Copy all links" }));
    await waitFor(() =>
      expect(writeText).toHaveBeenCalledWith(
        "https://a.test\nhttps://a.test/changelog",
      ),
    );
  });
});
