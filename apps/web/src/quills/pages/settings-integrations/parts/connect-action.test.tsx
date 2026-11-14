import { fireEvent, waitFor, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vite-plus/test";
import { renderComponent } from "../../../test/render";
import { toast } from "../../../ui/upstream";
import type { Connector } from "../connectors";
import { ConnectAction } from "./connect-action";

describe("ConnectAction", () => {
  it("starts an OAuth provider at once with one named button", async () => {
    const connect = vi.fn(async () => null);
    const view = renderComponent(
      <ConnectAction
        workspaceId="workspace_1"
        name="Slack"
        connector={{ fields: [], connect }}
        onConnected={() => undefined}
      />,
    );
    fireEvent.click(view.getByRole("button", { name: "Connect Slack" }));
    await waitFor(() =>
      expect(connect).toHaveBeenCalledWith("workspace_1", {}),
    );
  });

  it("saves a key in a dialog, closes it and reports the connection", async () => {
    const success = vi.spyOn(toast, "success");
    const onConnected = vi.fn();
    const connector: Connector = {
      fields: [
        {
          name: "apiKey",
          labelKey: "settings-connections.integrations.fields.apiKey",
          secret: true,
        },
      ],
      connect: vi.fn(async () => null),
    };
    const view = renderComponent(
      <ConnectAction
        workspaceId="workspace_1"
        name="Stripe"
        connector={connector}
        onConnected={onConnected}
      />,
    );
    fireEvent.click(view.getByRole("button", { name: "Connect Stripe" }));
    const dialog = await view.findByRole("dialog", { name: "Connect Stripe" });
    fireEvent.change(within(dialog).getByLabelText("API key"), {
      target: { value: "rk_value" },
    });
    fireEvent.click(within(dialog).getByRole("button", { name: "Connect" }));
    await waitFor(() => expect(onConnected).toHaveBeenCalledOnce());
    expect(connector.connect).toHaveBeenCalledWith("workspace_1", {
      apiKey: "rk_value",
    });
    expect(success).toHaveBeenCalledWith("Stripe is connected.");
    await waitFor(() => expect(view.queryByRole("dialog")).toBeNull());
  });
});
