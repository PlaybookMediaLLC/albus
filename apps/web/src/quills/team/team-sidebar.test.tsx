import {
  createMemoryHistory,
  createRootRoute,
  createRouter,
  RouterContextProvider,
} from "@tanstack/react-router";
import { fireEvent, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vite-plus/test";
import { getTeamCountsFixture } from "../api/team/get-team-counts.fixture";
import { renderComponent } from "../test/render";
import { TeamRuntimeProvider } from "./runtime";
import type { ShellSection } from "./shell-section";
import { TeamSidebar } from "./team-sidebar";

const permissions = {
  read: true,
  create: true,
  update: true,
  delete: true,
  manageSettings: true,
};

function render(
  section: ShellSection,
  {
    onNavigate = vi.fn(),
    create = true,
    favorites = [] as { path: string; label: string }[],
  } = {},
) {
  return renderComponent(
    <RouterContextProvider
      router={createRouter({
        routeTree: createRootRoute(),
        history: createMemoryHistory(),
      })}
    >
      <TeamRuntimeProvider
        value={{
          workspaceId: "workspace_1",
          viewer: { kind: "user", id: "user_1" },
          permissions: { ...permissions, create },
        }}
      >
        <TeamSidebar
          workspaceId="workspace_1"
          section={section}
          counts={getTeamCountsFixture.ok()}
          favorites={favorites}
          onNavigate={onNavigate}
        />
      </TeamRuntimeProvider>
    </RouterContextProvider>,
  );
}

describe("TeamSidebar", () => {
  it("shows the section name, New request and the views of the section", () => {
    vi.stubGlobal("Notification", { permission: "default" });
    const onNavigate = vi.fn();
    const view = render("requests", { onNavigate });
    // The visible title, and the list name that only screen readers get.
    const [title, label] = view.getAllByText("Requests");
    expect(title).not.toHaveClass("sr-only");
    expect(label).toHaveClass("sr-only");
    expect(view.getByRole("list", { name: "Requests" })).toBeInTheDocument();
    const create = view.getByRole("link", { name: "New request" });
    expect(create).toHaveAttribute(
      "href",
      "/feedback/workspace_1/posts?new=true",
    );
    fireEvent.click(create);
    expect(onNavigate).toHaveBeenCalledOnce();
    const nav = view.getByRole("navigation", { name: "Teammate app" });
    expect(
      within(nav).getByRole("link", { name: "Under review 0" }),
    ).toBeVisible();
    expect(within(nav).queryByRole("link", { name: "Queue" })).toBeNull();
    // The bell has the browser notification switch now.
    expect(view.queryByRole("switch")).toBeNull();
    vi.unstubAllGlobals();
  });

  it("leaves Settings to the rail and New request out without the create permission", () => {
    const view = render("workspace", { create: false });
    const nav = view.getByRole("navigation", { name: "Teammate app" });
    expect(within(nav).getByRole("link", { name: "Overview" })).toBeVisible();
    expect(within(nav).queryByRole("link", { name: "Settings" })).toBeNull();
    expect(view.queryByRole("link", { name: "New request" })).toBeNull();
  });

  it("lists the starred views above the section's views", () => {
    const view = render("workspace", {
      favorites: [
        {
          path: "/feedback/workspace_1/posts?statusId=status_1",
          label: "Planned",
        },
      ],
    });
    const favorites = view.getByRole("navigation", { name: "Favorites" });
    expect(
      within(favorites).getByRole("link", { name: "Planned" }),
    ).toHaveAttribute("href", "/feedback/workspace_1/posts?statusId=status_1");
  });

  it("leaves out Favorites when nothing is starred", () => {
    const view = render("workspace");
    expect(view.queryByRole("navigation", { name: "Favorites" })).toBeNull();
  });
});
