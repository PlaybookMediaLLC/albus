import { fireEvent, waitFor, within } from "@testing-library/react";
import { describe, expect, it } from "vite-plus/test";
import { getEmailChannelConfigFixture } from "../../../api/team/get-email-channel-config.fixture";
import { setInboundForwardingFixture } from "../../../api/team/set-inbound-forwarding.fixture";
import { mockApi } from "../../../test/mock-api";
import { renderComponent } from "../../../test/render";
import { TeamRuntimeProvider } from "../../../team/runtime";
import { SendingSection } from "./sending-section";

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

describe("SendingSection", () => {
  it("removes an address after a confirmation", async () => {
    const api = mockApi();
    api.reply({ id: "account_1", lastOnDomain: null });
    api.reply(getEmailChannelConfigFixture.ok());
    const view = renderComponent(
      <TeamRuntimeProvider value={team}>
        <SendingSection
          workspaceId="workspace_1"
          addresses={[
            setInboundForwardingFixture.ok({
              id: "account_1",
              role: "sending",
              address: "help@example.test",
              module: "feedback",
            }),
          ]}
        />
      </TeamRuntimeProvider>,
    );
    expect(view.getByText("Feedback")).toBeVisible();
    fireEvent.click(
      view.getByRole("button", { name: "Actions for help@example.test" }),
    );
    fireEvent.click(await view.findByRole("menuitem", { name: "Remove" }));
    const dialog = await view.findByRole("alertdialog", {
      name: "Remove the sending address?",
    });
    fireEvent.click(within(dialog).getByRole("button", { name: "Remove" }));
    await waitFor(() =>
      expect(api.calls("deleteQuillsChannelAccount")).toHaveLength(1),
    );
  });

  it("shows the empty state without the add button to a teammate who cannot manage settings", () => {
    mockApi();
    const view = renderComponent(
      <TeamRuntimeProvider
        value={{
          ...team,
          permissions: { ...team.permissions, manageSettings: false },
        }}
      >
        <SendingSection workspaceId="workspace_1" addresses={[]} />
      </TeamRuntimeProvider>,
    );
    expect(view.getByText("No sending addresses")).toBeVisible();
    expect(view.queryByRole("button", { name: "Add address" })).toBeNull();
  });
});
