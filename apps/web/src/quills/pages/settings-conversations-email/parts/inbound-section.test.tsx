import { fireEvent, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vite-plus/test";
import { getEmailChannelConfigFixture } from "../../../api/team/get-email-channel-config.fixture";
import { setInboundForwardingFixture } from "../../../api/team/set-inbound-forwarding.fixture";
import { choose } from "../../../test/actions";
import { mockApi } from "../../../test/mock-api";
import { renderComponent } from "../../../test/render";
import { TeamRuntimeProvider } from "../../../team/runtime";
import { InboundSection } from "./inbound-section";

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
const route = setInboundForwardingFixture.ok({
  forwardingTarget: "team@example.test",
});

const render = () =>
  renderComponent(
    <TeamRuntimeProvider value={team}>
      <InboundSection workspaceId="workspace_1" route={route} />
    </TeamRuntimeProvider>,
  );

describe("InboundSection", () => {
  it("stops the forwarding copies", async () => {
    const api = mockApi();
    api.reply({ ...route, forwardingTarget: null });
    api.reply(getEmailChannelConfigFixture.ok());
    const view = render();
    expect(view.getByLabelText("Forward a copy to")).toHaveValue(
      "team@example.test",
    );
    fireEvent.click(view.getByRole("button", { name: "Stop" }));
    await waitFor(() =>
      expect(api.calls("clearQuillsInboundForwarding")).toHaveLength(1),
    );
  });

  it("sets the sender check", async () => {
    const api = mockApi();
    api.reply({ ...route, inboundTrust: "lenient" });
    api.reply(getEmailChannelConfigFixture.ok());
    render();
    await choose("Sender check", "Accept unsigned senders");
    await waitFor(() =>
      expect(api.calls("setQuillsInboundTrust")).toHaveLength(1),
    );
    expect(await api.calls("setQuillsInboundTrust")[0]!.json()).toEqual({
      inboundTrust: "lenient",
    });
  });
});
