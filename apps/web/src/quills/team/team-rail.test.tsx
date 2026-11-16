import {
  createMemoryHistory,
  createRootRoute,
  createRouter,
  RouterContextProvider,
} from "@tanstack/react-router";
import { fireEvent, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vite-plus/test";
import { getNotificationUnreadCountFixture } from "../api/team/get-notification-unread-count.fixture";
import { getTeamCountsFixture } from "../api/team/get-team-counts.fixture";
import { mockApi } from "../test/mock-api";
import { renderComponent } from "../test/render";
import { TeamRuntimeProvider } from "./runtime";
import { TeamRail, type TeamRailProps } from "./team-rail";

vi.mock("@/components/user-avatar", () => ({ UserAvatar: () => null }));

const counts = getTeamCountsFixture.ok({
  queueConversations: 2,
  postStatuses: [{ id: "status_1", name: "Open", color: "gray", count: 0 }],
});

function render(props: Partial<TeamRailProps> = {}) {
  mockApi().reply(getNotificationUnreadCountFixture.ok());
  return renderComponent(
    <RouterContextProvider
      router={createRouter({
        routeTree: createRootRoute(),
        history: createMemoryHistory({
          initialEntries: ["/feedback/workspace_1/tickets"],
        }),
      })}
    >
      <TeamRuntimeProvider
        value={{
          workspaceId: "workspace_1",
          viewer: { kind: "user", id: "user_1" },
          permissions: {
            read: true,
            create: true,
            update: true,
            delete: true,
            manageSettings: true,
          },
        }}
      >
        <TeamRail
          workspaceId="workspace_1"
          workspaceName="Acme"
          mode="app"
          section="conversations"
          counts={counts}
          {...props}
        />
      </TeamRuntimeProvider>
    </RouterContextProvider>,
  );
}

describe("TeamRail", () => {
  it("links the sections, marks the current one and dots a section with work", () => {
    const onNavigate = vi.fn();
    const view = render({ onNavigate });
    const rail = view.getByRole("navigation", { name: "Sections" });
    const link = (name: string) => within(rail).getByRole("link", { name });
    // A section with work says so in its name, not only with the dot.
    const conversations = link("Conversations, new items");
    expect(conversations).toHaveAttribute(
      "href",
      "/feedback/workspace_1/conversations/queue",
    );
    expect(conversations).toHaveAttribute("aria-current", "page");
    expect(conversations.querySelector(".bg-warning")).not.toBeNull();
    expect(link("Requests")).toHaveAttribute(
      "href",
      "/feedback/workspace_1/posts",
    );
    expect(link("Requests")).not.toHaveAttribute("aria-current");
    expect(link("Requests").querySelector(".bg-warning")).toBeNull();
    expect(link("Workspace")).toHaveAttribute("href", "/feedback/workspace_1");
    expect(link("Settings")).not.toHaveAttribute("aria-current");
    fireEvent.click(link("Requests"));
    expect(onNavigate).toHaveBeenCalledOnce();
  });

  it("marks only Settings in the settings area and has the bell, Support and the workspace", () => {
    const view = render({ mode: "settings" });
    const rail = view.getByRole("navigation", { name: "Sections" });
    expect(
      within(rail).getByRole("link", { name: "Settings" }),
    ).toHaveAttribute("aria-current", "page");
    expect(
      within(rail).getByRole("link", { name: "Conversations, new items" }),
    ).not.toHaveAttribute("aria-current");
    expect(view.getByRole("button", { name: "Notifications" })).toBeVisible();
    expect(view.getByRole("link", { name: "Support" })).toHaveAttribute(
      "target",
      "_blank",
    );
    expect(view.getByRole("button", { name: "Acme" })).toBeVisible();
  });
});
