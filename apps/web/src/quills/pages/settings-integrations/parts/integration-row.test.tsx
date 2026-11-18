import { fireEvent, waitFor, within } from "@testing-library/react";
import { describe, expect, it } from "vite-plus/test";
import { mockApi } from "../../../test/mock-api";
import { renderComponent } from "../../../test/render";
import { TeamRuntimeProvider } from "../../../team/runtime";
import { IntegrationRow } from "./integration-row";

const render = (
  connection: { id: string; status: string } | undefined,
  manageSettings = true,
  provider = { id: "slack", name: "Slack", description: "Chat" },
) =>
  renderComponent(
    <TeamRuntimeProvider
      value={{
        workspaceId: "workspace_1",
        viewer: { kind: "user", id: "user_1" },
        permissions: {
          read: true,
          create: true,
          update: true,
          delete: true,
          manageSettings,
        },
      }}
    >
      <IntegrationRow
        workspaceId="workspace_1"
        provider={provider}
        connection={connection}
        onConnected={() => undefined}
      />
    </TeamRuntimeProvider>,
  );

describe("IntegrationRow", () => {
  it("offers Connect for a provider without a connection", () => {
    mockApi();
    const view = render(undefined);
    expect(view.getByRole("button", { name: "Connect Slack" })).toBeVisible();
  });

  it("shows the provider's logo, or its initial when there is no logo", () => {
    mockApi();
    const slack = render(undefined);
    expect(
      slack.container.querySelector("svg[data-brand=slack]"),
    ).not.toBeNull();
    slack.unmount();
    const freshdesk = render(undefined, true, {
      id: "freshdesk",
      name: "Freshdesk",
      description: "Help desk",
    });
    expect(freshdesk.container.querySelector("svg[data-brand]")).toBeNull();
    expect(freshdesk.getByText("F")).toBeInTheDocument();
  });

  it("disconnects after a confirmation", async () => {
    const api = mockApi();
    api.reply({ deleted: true });
    const view = render({ id: "integration_1", status: "active" });
    expect(view.getByText("Connected")).toBeVisible();
    fireEvent.click(view.getByRole("button", { name: "Actions for Slack" }));
    fireEvent.click(await view.findByRole("menuitem", { name: "Disconnect" }));
    const dialog = await view.findByRole("alertdialog", {
      name: "Disconnect Slack?",
    });
    fireEvent.click(within(dialog).getByRole("button", { name: "Disconnect" }));
    await waitFor(() =>
      expect(api.calls("deleteQuillsIntegration")).toHaveLength(1),
    );
  });

  it("shows a connection that is not active, without actions to a teammate who cannot manage settings", () => {
    mockApi();
    const view = render({ id: "integration_1", status: "paused" }, false);
    expect(view.getByText("Not active")).toBeVisible();
    expect(view.queryByRole("button")).toBeNull();
  });
});
