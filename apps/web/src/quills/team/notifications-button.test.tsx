import {
  createMemoryHistory,
  createRootRoute,
  createRouter,
  RouterContextProvider,
} from "@tanstack/react-router";
import { fireEvent, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vite-plus/test";
import { getNotificationPreferencesFixture } from "../api/team/get-notification-preferences.fixture";
import { getNotificationUnreadCountFixture } from "../api/team/get-notification-unread-count.fixture";
import { listNotificationsFixture } from "../api/team/list-notifications.fixture";
import { markAllNotificationsReadFixture } from "../api/team/mark-all-notifications-read.fixture";
import { markNotificationReadFixture } from "../api/team/mark-notification-read.fixture";
import { press } from "../test/actions";
import { mockApi } from "../test/mock-api";
import { renderComponent } from "../test/render";
import { NotificationsButton } from "./notifications-button";
import { TeamRuntimeProvider } from "./runtime";

const team = {
  workspaceId: "workspace_1",
  viewer: { kind: "user" as const, id: "user_1" },
  permissions: {
    read: true,
    create: true,
    update: true,
    delete: true,
    manageSettings: true,
  },
};
const notification = {
  id: "notification_1",
  type: "comment",
  title: "New comment on Dark mode",
  body: "**Yes**, please",
  postId: "post_1",
  commentId: null,
  readAt: null,
  createdAt: "2026-10-31T12:00:00.000Z",
  post: { id: "post_1", title: "Dark mode" },
};

const render = () =>
  renderComponent(
    <RouterContextProvider
      router={createRouter({
        routeTree: createRootRoute(),
        history: createMemoryHistory(),
      })}
    >
      <TeamRuntimeProvider value={team}>
        <NotificationsButton workspaceId="workspace_1" />
      </TeamRuntimeProvider>
    </RouterContextProvider>,
  );

afterEach(() => vi.unstubAllGlobals());

describe("NotificationsButton", () => {
  it("shows the unread count and lists the notifications when opened", async () => {
    const api = mockApi();
    api.reply(getNotificationUnreadCountFixture.ok({ count: 2 }));
    api.reply(
      listNotificationsFixture.ok({
        notifications: [notification],
        total: 1,
        unreadCount: 2,
      }),
    );
    api.reply(markNotificationReadFixture.ok());
    const view = render();
    fireEvent.click(
      await view.findByRole("button", { name: "Notifications, 2 unread" }),
    );
    const item = await view.findByRole("link", {
      name: /New comment on Dark mode/,
    });
    expect(item).toHaveAttribute("href", "/feedback/workspace_1/posts/post_1");
    expect(item).toHaveTextContent("Yes, please");
    expect(item).toHaveTextContent("Unread");
    fireEvent.click(item);
    await waitFor(() =>
      expect(api.calls("markQuillsNotificationRead")).toHaveLength(1),
    );
  });

  it("marks all as read", async () => {
    const api = mockApi();
    api.reply(getNotificationUnreadCountFixture.ok({ count: 1 }));
    api.reply(listNotificationsFixture.ok({ notifications: [notification] }));
    api.reply(markAllNotificationsReadFixture.ok());
    api.reply(getNotificationUnreadCountFixture.ok());
    api.reply(listNotificationsFixture.ok());
    const view = render();
    fireEvent.click(
      await view.findByRole("button", { name: "Notifications, 1 unread" }),
    );
    await view.findByRole("link", { name: /Dark mode/ });
    press("Mark all as read");
    await waitFor(() =>
      expect(api.calls("markQuillsAllNotificationsRead")).toHaveLength(1),
    );
  });

  it("says all caught up when there is no activity", async () => {
    const api = mockApi();
    api.reply(getNotificationUnreadCountFixture.ok({ count: 0 }));
    api.reply(listNotificationsFixture.ok({ notifications: [] }));
    const view = render();
    fireEvent.click(await view.findByRole("button", { name: "Notifications" }));
    await waitFor(() =>
      expect(view.getByRole("status")).toHaveTextContent("All caught up"),
    );
    expect(view.getByText("Activity")).toBeVisible();
  });

  it("opens the settings from the gear and goes back to the list", async () => {
    const api = mockApi();
    api.reply(getNotificationUnreadCountFixture.ok({ count: 0 }));
    api.reply(listNotificationsFixture.ok({ notifications: [notification] }));
    api.reply(getNotificationPreferencesFixture.ok());
    const view = render();
    fireEvent.click(await view.findByRole("button", { name: "Notifications" }));
    await view.findByRole("link", { name: /Dark mode/ });
    press("Notification settings");
    expect(
      await view.findByRole("group", { name: "In app" }),
    ).toBeInTheDocument();
    expect(view.queryByRole("link", { name: /Dark mode/ })).toBeNull();
    press("Back to activity");
    expect(
      view.getByRole("button", { name: "Notification settings" }),
    ).toHaveFocus();
    expect(view.getByRole("link", { name: /Dark mode/ })).toBeVisible();
  });

  it("shows a desktop notification for a new one while the app is in the background", async () => {
    const shown = vi.fn();
    vi.stubGlobal(
      "Notification",
      Object.assign(shown, { permission: "granted" }),
    );
    window.localStorage.setItem("quills.desktop-notifications", "on");
    vi.spyOn(document, "hidden", "get").mockReturnValue(true);
    vi.useFakeTimers({ toFake: ["Date"] });
    const start = Date.parse("2026-11-14T10:00:30.000Z");
    vi.setSystemTime(start);
    const api = mockApi();
    for (const count of [1, 3, 1, 3])
      api.reply(getNotificationUnreadCountFixture.ok({ count }));
    const view = render();
    const refresh = async (count: number) => {
      void view.queryClient.invalidateQueries();
      await view.findByRole("button", { name: new RegExp(`${count} unread`) });
    };
    await view.findByRole("button", { name: /1 unread/ });
    await refresh(3);
    // The tag makes several hidden tabs show this notification once.
    const minute = Math.floor(start / 60_000);
    expect(shown).toHaveBeenLastCalledWith("2 new notifications", {
      tag: `quills-notifications:workspace_1:3:${minute}`,
    });
    // The same count later has a new tag, so it does not replace the old one in silence.
    vi.setSystemTime(start + 120_000);
    await refresh(1);
    await refresh(3);
    expect(shown).toHaveBeenCalledTimes(2);
    expect(shown).toHaveBeenLastCalledWith("2 new notifications", {
      tag: `quills-notifications:workspace_1:3:${minute + 2}`,
    });
    vi.useRealTimers();
    window.localStorage.clear();
  });
});
