import { waitFor } from "@testing-library/react";
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vite-plus/test";
import { getNotificationUnreadCountFixture } from "../api/team/get-notification-unread-count.fixture";
import { mockApi } from "../test/mock-api";
import { renderComponent } from "../test/render";
import { AppBadge } from "./app-badge";

const inbox = vi.hoisted(() => ({ data: [] as { isRead: boolean }[] }));
// The Kaneo inbox query uses Kaneo's client, which mockApi does not serve.
vi.mock("@/hooks/queries/notification/use-get-notifications", () => ({
  default: (workspaceId?: string) =>
    workspaceId ? inbox : { data: undefined },
}));

const viewer = { kind: "user" as const, id: "user_1" };
const invoke = vi.fn().mockResolvedValue(undefined);
const badge = (value: number | null) => [
  "plugin:window|set_badge_count",
  { label: "main", value },
];

beforeEach(() => {
  invoke.mockClear();
  inbox.data = [{ isRead: false }, { isRead: true }, { isRead: false }];
  (window as { __TAURI_INTERNALS__?: unknown }).__TAURI_INTERNALS__ = {
    invoke,
  };
});
afterEach(() => {
  delete (window as { __TAURI_INTERNALS__?: unknown }).__TAURI_INTERNALS__;
});

describe("AppBadge", () => {
  it("adds the Kaneo inbox and the Quills activity, and clears on leave", async () => {
    mockApi().reply(getNotificationUnreadCountFixture.ok({ count: 4 }));
    const view = renderComponent(
      <AppBadge workspaceId="workspace_1" viewer={viewer} quills />,
    );
    await waitFor(() => expect(invoke).toHaveBeenLastCalledWith(...badge(6)));
    view.unmount();
    expect(invoke).toHaveBeenLastCalledWith(...badge(null));
  });

  it("counts the Kaneo inbox only without Quills access", async () => {
    const api = mockApi();
    renderComponent(
      <AppBadge workspaceId="workspace_1" viewer={viewer} quills={false} />,
    );
    await waitFor(() => expect(invoke).toHaveBeenLastCalledWith(...badge(2)));
    expect(api.calls()).toHaveLength(0);
  });

  it("makes no request in a browser", async () => {
    delete (window as { __TAURI_INTERNALS__?: unknown }).__TAURI_INTERNALS__;
    inbox.data = [];
    const api = mockApi();
    renderComponent(
      <AppBadge workspaceId="workspace_1" viewer={viewer} quills />,
    );
    await new Promise((done) => queueMicrotask(() => done(undefined)));
    expect(api.calls()).toHaveLength(0);
  });

  it("keeps the badge while another page still shows it", async () => {
    mockApi().reply(getNotificationUnreadCountFixture.ok({ count: 1 }));
    const first = renderComponent(
      <AppBadge workspaceId="workspace_1" viewer={viewer} quills={false} />,
    );
    const second = renderComponent(
      <AppBadge workspaceId="workspace_1" viewer={viewer} quills={false} />,
    );
    await waitFor(() => expect(invoke).toHaveBeenLastCalledWith(...badge(2)));
    first.unmount();
    expect(invoke).not.toHaveBeenLastCalledWith(...badge(null));
    second.unmount();
    expect(invoke).toHaveBeenLastCalledWith(...badge(null));
  });
});
