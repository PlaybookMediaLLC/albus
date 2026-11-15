import { describe, expect, it } from "vite-plus/test";
import { getPublicPortalConfigFixture } from "../api/portal/get-public-portal-config.fixture";
import { renderComponent } from "../test/render";
import { PortalNavigation } from "./portal-navigation";

const nav = getPublicPortalConfigFixture.ok().nav;

describe("PortalNavigation", () => {
  it("keeps nested routes in their section and scopes every link to the workspace", () => {
    const view = renderComponent(
      <PortalNavigation
        workspaceId="workspace_test_1"
        currentPath="/portal/workspace_test_1/posts/post_test_1"
        nav={nav}
      />,
    );
    expect(view.getByRole("link", { name: "Feedback" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    expect(view.getByRole("link", { name: "Help" })).toHaveAttribute(
      "href",
      "/portal/workspace_test_1/hc",
    );
    expect(view.getByRole("link", { name: "Updates" })).not.toHaveAttribute(
      "aria-current",
    );
  });
  it("marks conversation links as support", () => {
    const view = renderComponent(
      <PortalNavigation
        workspaceId="workspace_test_1"
        currentPath="/portal/workspace_test_1/conversations/thread_test_1"
        nav={nav}
      />,
    );
    expect(view.getByRole("link", { name: "Support" })).toHaveAttribute(
      "aria-current",
      "page",
    );
  });
  it("shows only the tabs that are on, then the custom links", () => {
    const view = renderComponent(
      <PortalNavigation
        workspaceId="workspace_test_1"
        currentPath="/portal/workspace_test_1"
        nav={{
          tabs: { ...nav.tabs, roadmap: false, changelog: false },
          links: [
            { label: "Docs", url: "https://docs.example.test", newTab: true },
            { label: "Blog", url: "https://blog.example.test", newTab: false },
          ],
        }}
      />,
    );
    expect(view.getAllByRole("link").map((link) => link.textContent)).toEqual([
      "Feedback",
      "Help",
      "Status",
      "Support",
      "Docs",
      "Blog",
    ]);
    const docs = view.getByRole("link", { name: "Docs" });
    expect(docs).toHaveAttribute("href", "https://docs.example.test");
    expect(docs).toHaveAttribute("target", "_blank");
    expect(docs).toHaveAttribute("rel", "noopener noreferrer");
    expect(view.getByRole("link", { name: "Blog" })).not.toHaveAttribute(
      "target",
    );
  });
});
