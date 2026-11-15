import { fireEvent, waitFor, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vite-plus/test";
import { getNotificationPreferencesFixture } from "../api/team/get-notification-preferences.fixture";
import { updateNotificationPreferencesFixture } from "../api/team/update-notification-preferences.fixture";
import { mockApi } from "../test/mock-api";
import { renderComponent } from "../test/render";
import { Popover, PopoverPopup } from "../ui/upstream";
import { NotificationSettings } from "./notification-settings";
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
const stored = getNotificationPreferencesFixture.ok({
  emailStatusChange: false,
  emailNewComment: false,
  matrix: [
    { type: "post_status_changed", inApp: null, email: true, push: null },
    { type: "comment_created", inApp: false, email: null, push: null },
    { type: "weekly_digest", inApp: null, email: false, push: null },
  ],
});
const STATUS = "Status changes on requests you follow";
const COMMENTS = "Comments on requests you follow";

const render = (onBack = vi.fn()) => {
  const view = renderComponent(
    <TeamRuntimeProvider value={team}>
      <Popover open>
        <PopoverPopup>
          <NotificationSettings workspaceId="workspace_1" onBack={onBack} />
        </PopoverPopup>
      </Popover>
    </TeamRuntimeProvider>,
  );
  const group = (name: string) => within(view.getByRole("group", { name }));
  return Object.assign(view, {
    inApp: (name: string) => group("In app").getByRole("switch", { name }),
    email: (name: string) => group("Email").getByRole("switch", { name }),
  });
};

describe("NotificationSettings", () => {
  it("shows the effective values and goes back", async () => {
    const api = mockApi();
    api.reply(stored);
    const onBack = vi.fn();
    const view = render(onBack);
    await view.findByRole("group", { name: "In app" });
    // No cell is on; an explicit cell wins; no cell uses the legacy mail flag.
    expect(view.inApp(STATUS)).toBeChecked();
    expect(view.inApp(COMMENTS)).not.toBeChecked();
    expect(view.email(STATUS)).toBeChecked();
    expect(view.email(COMMENTS)).not.toBeChecked();
    expect(view.email("Mute all email")).not.toBeChecked();
    const back = view.getByRole("button", { name: "Back to activity" });
    expect(back).toHaveFocus();
    fireEvent.click(back);
    expect(onBack).toHaveBeenCalledOnce();
  });

  it("has the browser notifications switch, which left the sidebar for this view", async () => {
    vi.stubGlobal("Notification", { permission: "default" });
    const api = mockApi();
    api.reply(stored);
    const view = render();
    await view.findByRole("group", { name: "In app" });
    expect(
      view.getByRole("switch", { name: "Browser notifications" }),
    ).toBeInTheDocument();
    vi.unstubAllGlobals();
  });

  it("shows a change at once and sends the full matrix", async () => {
    const api = mockApi();
    api.reply(stored);
    let finish!: (body: unknown) => void;
    api.defer(({ resolve }) => (finish = resolve));
    const saved = {
      ...stored,
      matrix: [
        stored.matrix[0],
        { type: "comment_created", inApp: false, email: true, push: null },
        stored.matrix[2],
      ],
    };
    api.reply(getNotificationPreferencesFixture.ok(saved));
    const view = render();
    await view.findByRole("group", { name: "Email" });
    fireEvent.click(view.email(COMMENTS));
    // The save waits for the reply, but the switch shows the change.
    await waitFor(() => expect(view.email(COMMENTS)).toBeChecked());
    expect(view.email(COMMENTS)).toHaveAttribute("aria-disabled", "true");
    expect(api.calls("updateQuillsNotificationPreferences")).toHaveLength(1);
    expect(
      await api.calls("updateQuillsNotificationPreferences")[0].json(),
    ).toEqual({
      matrix: [
        { type: "post_status_changed", email: true },
        { type: "comment_created", inApp: false, email: true },
        { type: "weekly_digest", email: false },
      ],
    });
    finish(updateNotificationPreferencesFixture.ok(saved));
    await waitFor(() =>
      expect(view.email(COMMENTS)).not.toHaveAttribute("aria-disabled"),
    );
    expect(view.email(COMMENTS)).toBeChecked();
  });

  it("moves the switch back and shows the error when the save fails", async () => {
    const api = mockApi();
    api.reply(stored);
    api.reply({ message: "Request could not be completed" }, 500);
    const view = render();
    await view.findByRole("group", { name: "In app" });
    fireEvent.click(view.inApp(STATUS));
    expect(await view.findByRole("alert")).toHaveTextContent(
      "Quills could not save the change. Try again.",
    );
    expect(view.inApp(STATUS)).toBeChecked();
    expect(view.inApp(STATUS)).not.toHaveAttribute("aria-disabled");
  });

  it("disables the email types while all email is muted", async () => {
    const api = mockApi();
    api.reply(stored);
    api.reply(updateNotificationPreferencesFixture.ok({ emailMuted: true }));
    api.reply(getNotificationPreferencesFixture.ok({ emailMuted: true }));
    const view = render();
    await view.findByRole("group", { name: "Email" });
    expect(view.email(STATUS)).not.toHaveAttribute("aria-disabled");
    fireEvent.click(view.email("Mute all email"));
    await waitFor(() =>
      expect(view.email("Mute all email")).not.toHaveAttribute("aria-disabled"),
    );
    expect(
      await api.calls("updateQuillsNotificationPreferences")[0].json(),
    ).toEqual({ emailMuted: true });
    expect(view.email("Mute all email")).toBeChecked();
    expect(view.email(STATUS)).toHaveAttribute("aria-disabled", "true");
    expect(view.email(COMMENTS)).toHaveAttribute("aria-disabled", "true");
    expect(view.inApp(STATUS)).not.toHaveAttribute("aria-disabled");
  });
});
