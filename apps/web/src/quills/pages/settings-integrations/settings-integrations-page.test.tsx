import { fireEvent, waitFor, within } from "@testing-library/react";
import { describe, expect, it } from "vite-plus/test";
import { deleteIntegrationFixture } from "../../api/team/delete-integration.fixture";
import { listIntegrationCatalogFixture } from "../../api/team/list-integration-catalog.fixture";
import { listIntegrationsFixture } from "../../api/team/list-integrations.fixture";
import { describePageContract } from "../../test/contracts";
import { mockApi } from "../../test/mock-api";
import { renderPage } from "../../test/render";
import { meta } from "./meta";
import { SettingsIntegrationsPage } from "./settings-integrations-page";

const provider = (id: string, name: string, available = true) => ({
  id,
  name,
  category: "notifications",
  description: `${name} description`,
  available,
  events: [],
});
const catalog = listIntegrationCatalogFixture.ok({
  providers: [
    provider("slack", "Slack"),
    provider("stripe", "Stripe"),
    provider("later", "Later tool", false),
  ],
});
const slack = {
  id: "integration_test_1",
  integrationType: "slack",
  status: "active",
  workspaceName: null,
  account: null,
  connectedAt: "2026-01-01T00:00:00.000Z",
};
let api: ReturnType<typeof mockApi>;
const prepare = (connections = [slack]) => {
  api = mockApi();
  api.reply(catalog);
  api.reply(listIntegrationsFixture.ok({ integrations: connections }));
  return api;
};

describe("SettingsIntegrationsPage", () => {
  describePageContract(meta, SettingsIntegrationsPage, {
    loading: {
      prepare: () => {
        const api = mockApi();
        api.defer(() => undefined);
        api.defer(() => undefined);
      },
    },
    failed: {
      prepare: () => {
        const api = mockApi();
        api.fail();
        api.fail();
      },
    },
    ready: {
      prepare: () => {
        prepare();
      },
      assert: async (view) => {
        expect(await view.findByText("Connected")).toBeVisible();
        expect(
          view.getByRole("button", { name: "Connect Stripe" }),
        ).toBeVisible();
        expect(view.queryByText("Later tool")).not.toBeInTheDocument();
      },
    },
    done: {
      prepare: () => {
        prepare();
        api.reply(deleteIntegrationFixture.ok({ deleted: true }));
        api.reply(listIntegrationsFixture.ok());
      },
      act: async (view) => {
        fireEvent.click(
          await view.findByRole("button", { name: "Actions for Slack" }),
        );
        fireEvent.click(
          await view.findByRole("menuitem", { name: "Disconnect" }),
        );
        const dialog = await view.findByRole("alertdialog");
        fireEvent.click(
          within(dialog).getByRole("button", { name: "Disconnect" }),
        );
      },
      assert: async (view) => {
        await waitFor(() =>
          expect(api.calls("deleteQuillsIntegration")).toHaveLength(1),
        );
        expect(
          new URL(api.calls("deleteQuillsIntegration")[0]!.url).pathname,
        ).toContain("/integrations/integration_test_1");
        expect(
          await view.findByRole("button", { name: "Connect Slack" }),
        ).toBeVisible();
      },
    },
  });

  it("saves a key in the connect dialog and shows the new connection", async () => {
    prepare([]);
    api.reply({ integration: null });
    api.reply(
      listIntegrationsFixture.ok({
        integrations: [
          { ...slack, id: "integration_test_2", integrationType: "stripe" },
        ],
      }),
    );
    const view = renderPage(SettingsIntegrationsPage, meta);
    fireEvent.click(
      await view.findByRole("button", { name: "Connect Stripe" }),
    );
    const dialog = await view.findByRole("dialog", { name: "Connect Stripe" });
    fireEvent.click(within(dialog).getByRole("button", { name: "Connect" }));
    expect(await within(dialog).findByText("Enter a value.")).toBeVisible();
    fireEvent.change(within(dialog).getByLabelText("API key"), {
      target: { value: "rk_test_value" },
    });
    fireEvent.click(within(dialog).getByRole("button", { name: "Connect" }));
    await waitFor(() =>
      expect(api.calls("saveQuillsStripeKey")).toHaveLength(1),
    );
    expect(await api.calls("saveQuillsStripeKey")[0]!.json()).toEqual({
      apiKey: "rk_test_value",
    });
    await waitFor(() =>
      expect(view.queryByRole("button", { name: "Connect Stripe" })).toBeNull(),
    );
  });

  it("shows the connections without Connect or Disconnect to a teammate without manage_settings", async () => {
    prepare();
    const view = renderPage(SettingsIntegrationsPage, meta, {
      permissions: { manageSettings: false },
    });
    expect(await view.findByText("Connected")).toBeVisible();
    expect(
      view.queryByRole("button", { name: /^Connect|^Actions/ }),
    ).toBeNull();
  });
});
