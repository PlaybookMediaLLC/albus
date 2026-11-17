import {
  createMemoryHistory,
  createRootRoute,
  createRouter,
  RouterContextProvider,
} from "@tanstack/react-router";
import { waitFor, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vite-plus/test";
import { getNotificationUnreadCountFixture } from "../api/team/get-notification-unread-count.fixture";
import { getTeamCountsFixture } from "../api/team/get-team-counts.fixture";
import { listSettingsFixture } from "../api/team/list-settings.fixture";
import { press } from "../test/actions";
import { mockApi } from "../test/mock-api";
import { renderComponent } from "../test/render";
import { TeamRuntimeProvider } from "./runtime";
import { TeamShell } from "./team-shell";

vi.mock("@/components/user-avatar", () => ({ UserAvatar: () => null }));
vi.mock("@/hooks/queries/config/use-get-config", () => ({
  default: () => ({ data: { billingEnabled: false } }),
}));

const counts = getTeamCountsFixture.ok({
  queueConversations: 3,
  openConversations: 5,
  pendingDuplicates: 2,
  postStatuses: [
    { id: "status_1", name: "Pending", color: "gray", count: 4 },
    { id: "status_2", name: "Planned", color: "blue", count: 1 },
  ],
});

function renderShell(path: string) {
  const router = createRouter({
    routeTree: createRootRoute(),
    history: createMemoryHistory({ initialEntries: [path] }),
  });
  return renderComponent(
    <RouterContextProvider router={router}>
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
        <TeamShell
          workspaceId="workspace_1"
          workspaceName="Acme"
          workspaceRole="admin"
        >
          <p>Page content</p>
        </TeamShell>
      </TeamRuntimeProvider>
    </RouterContextProvider>,
  );
}

/** The sidebar asks for the unread notifications first, then the shell for the counts. */
function answer(body: unknown = counts, status = 200) {
  const api = mockApi();
  api.reply(getNotificationUnreadCountFixture.ok());
  api.reply(body, status);
  return api;
}

describe("TeamShell", () => {
  it("shows the rail and the views of the current section, with counts, and the page", async () => {
    const api = answer();
    const view = renderShell("/feedback/workspace_1/conversations/queue");
    const rail = view.getByRole("navigation", { name: "Sections" });
    expect(
      await within(rail).findByRole("link", {
        name: "Conversations, new items",
      }),
    ).toHaveAttribute("aria-current", "page");
    const nav = view.getByRole("navigation", { name: "Teammate app" });
    expect(
      within(nav).getByRole("list", { name: "Conversations" }),
    ).toBeInTheDocument();
    expect(within(nav).queryByRole("list", { name: "Requests" })).toBeNull();
    const queue = await within(nav).findByRole("link", { name: "Queue 3" });
    expect(queue).toHaveAttribute("aria-current", "page");
    expect(within(queue).getByText("3")).toHaveClass("bg-warning/15");
    expect(within(nav).getByText("5")).not.toHaveClass("bg-warning/15");
    expect(document.documentElement).toHaveAttribute("data-quills-shell");
    press("Acme");
    expect(await view.findByText("Admin")).toBeVisible();
    expect(view.getByRole("main")).toHaveTextContent("Page content");
    expect(api.calls("getQuillsTeamCounts")).toHaveLength(1);
  });

  it("lists the open post statuses as Requests, the first with the warning badge", async () => {
    answer();
    const view = renderShell("/feedback/workspace_1/posts?statusId=status_2");
    const requests = view.getByRole("list", { name: "Requests" });
    const pending = await within(requests).findByRole("link", {
      name: "Pending 4",
    });
    expect(within(pending).getByText("4")).toHaveClass("bg-warning/15");
    const planned = within(requests).getByRole("link", { name: "Planned 1" });
    expect(planned).toHaveAttribute(
      "href",
      "/feedback/workspace_1/posts?statusId=status_2",
    );
    expect(planned).toHaveAttribute("aria-current", "page");
    expect(pending).not.toHaveAttribute("aria-current");
  });

  it("marks Requests on an open request, where the router does not mark the link", () => {
    answer();
    const view = renderShell("/feedback/workspace_1/posts/post_1");
    const rail = view.getByRole("navigation", { name: "Sections" });
    expect(
      within(rail).getByRole("link", { name: /^Requests/ }),
    ).toHaveAttribute("aria-current", "page");
  });

  it("marks html for the 95% scale only while the shell is open", () => {
    answer();
    const view = renderShell("/feedback/workspace_1");
    expect(document.documentElement).toHaveAttribute("data-quills-shell");
    view.unmount();
    expect(document.documentElement).not.toHaveAttribute("data-quills-shell");
  });

  it("shows the views without counts when the counts request fails", async () => {
    const api = answer(getTeamCountsFixture.problem(403).body, 403);
    const view = renderShell("/feedback/workspace_1");
    await waitFor(() => expect(api.calls()).toHaveLength(2));
    expect(view.getByRole("link", { name: "Workspace" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    expect(view.getByRole("link", { name: "Overview" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    expect(view.getByRole("link", { name: "Duplicates" })).toBeVisible();
  });

  it("opens the sidebar in a sheet on small screens", async () => {
    const api = answer();
    api.reply(getNotificationUnreadCountFixture.ok());
    const view = renderShell("/feedback/workspace_1/insights");
    press("Menu");
    const sheet = await view.findByRole("dialog", { name: "Teammate app" });
    expect(
      await within(sheet).findByRole("link", { name: "Insights" }),
    ).toBeVisible();
  });

  it("shows the settings sidebar under /settings and asks for no counts", async () => {
    const api = mockApi();
    api.reply(getNotificationUnreadCountFixture.ok());
    api.reply(listSettingsFixture.ok());
    const view = renderShell("/feedback/workspace_1/settings/integrations");
    const nav = view.getByRole("navigation", { name: "Settings" });
    expect(
      within(nav).getByRole("link", { name: "Integrations" }),
    ).toHaveAttribute("aria-current", "page");
    expect(
      view.queryByRole("navigation", { name: "Teammate app" }),
    ).not.toBeInTheDocument();
    expect(view.getByRole("link", { name: "Settings" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    await waitFor(() => expect(api.calls()).toHaveLength(2));
    expect(api.calls("getQuillsTeamCounts")).toHaveLength(0);
    expect(view.getByRole("main")).toHaveTextContent("Page content");
  });

  it("shows no sidebar and no menu bar in the changelog editor", () => {
    mockApi();
    const view = renderShell("/feedback/workspace_1/changelog/new");
    expect(view.queryByRole("navigation")).not.toBeInTheDocument();
    expect(view.queryByRole("button", { name: "Menu" })).toBeNull();
    expect(view.getByRole("main")).toHaveTextContent("Page content");
  });
});
