import { fireEvent, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vite-plus/test";
import { describePageContract } from "../../test/contracts";
import { mockApi } from "../../test/mock-api";
import { renderPage } from "../../test/render";
import { getDeveloperSettingsFixture } from "../../api/team/get-developer-settings.fixture";
import { updateDeveloperSettingsFixture } from "../../api/team/update-developer-settings.fixture";
import { meta } from "./meta";
import { SettingsApiPage } from "./settings-api-page";

// Kaneo's API keys section has its own tests and requests.
vi.mock("@/components/settings/api-keys/api-keys-settings", () => ({
  ApiKeysSettings: () => <h1>API keys</h1>,
}));

let api: ReturnType<typeof mockApi>;

describe("SettingsApiPage", () => {
  describePageContract(meta, SettingsApiPage, {
    loading: {
      prepare: () => {
        mockApi().defer(() => undefined);
      },
    },
    failed: {
      prepare: () => {
        mockApi().fail();
      },
    },
    ready: {
      prepare: () => {
        mockApi().reply(getDeveloperSettingsFixture.ok());
      },
      assert: async (view) => {
        expect(
          await view.findByRole("switch", { name: "MCP server" }),
        ).not.toBeChecked();
      },
    },
    done: {
      prepare: () => {
        api = mockApi();
        api.reply(getDeveloperSettingsFixture.ok());
        api.reply(updateDeveloperSettingsFixture.ok({ mcpEnabled: true }));
        api.reply(getDeveloperSettingsFixture.ok({ mcpEnabled: true }));
      },
      act: async (view) => {
        fireEvent.click(
          await view.findByRole("switch", { name: "MCP server" }),
        );
      },
      assert: async (view) => {
        await waitFor(() =>
          expect(api.calls("updateQuillsDeveloperSettings")).toHaveLength(1),
        );
        expect(
          await api.calls("updateQuillsDeveloperSettings")[0]!.json(),
        ).toEqual({ mcpEnabled: true });
        await waitFor(() =>
          expect(
            view.getByRole("switch", { name: "MCP server" }),
          ).toBeChecked(),
        );
      },
    },
  });

  it("shows the switches disabled to a teammate without manage_settings", async () => {
    mockApi().reply(getDeveloperSettingsFixture.ok());
    const view = renderPage(SettingsApiPage, meta, {
      permissions: { manageSettings: false },
    });
    for (const name of [
      "MCP server",
      "MCP for portal users",
      "OAuth client registration",
      "Personal API keys",
    ])
      expect(await view.findByRole("switch", { name })).toHaveAttribute(
        "aria-disabled",
        "true",
      );
  });
});
