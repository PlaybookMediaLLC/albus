import { fireEvent, waitFor, within } from "@testing-library/react";
import { describe, expect, it } from "vite-plus/test";
import { mockApi } from "../../../test/mock-api";
import { renderComponent } from "../../../test/render";
import { TeamRuntimeProvider } from "../../../team/runtime";
import { IntegrationRow } from "./integration-row";

const render = (
  connection: { id: string; status: string } | undefined,
  manageSettings = true,
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
        provider={{ id: "slack", name: "Slack", description: "Chat" }}
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
