import { fireEvent, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vite-plus/test";
import { getPortalSettingsFixture } from "../../api/team/get-portal-settings.fixture";
import { updatePortalSettingsFixture } from "../../api/team/update-portal-settings.fixture";
import { describePageContract } from "../../test/contracts";
import { mockApi } from "../../test/mock-api";
import { renderPage } from "../../test/render";
import { meta } from "./meta";
import { SettingsLoginPage } from "./settings-login-page";

vi.mock("@/hooks/queries/config/use-get-config", () => ({
  default: () => ({
    data: {
      disableLoginForm: false,
      hasGoogleSignIn: true,
      hasGithubSignIn: false,
      hasDiscordSignIn: false,
      hasCustomOAuth: false,
      customOAuthName: null,
    },
  }),
}));

let api: ReturnType<typeof mockApi>;
const ready = () => {
  api = mockApi();
  api.reply(getPortalSettingsFixture.ok());
  api.reply({ secret: "wsec_0123456789abcdef" });
};

describe("SettingsLoginPage", () => {
  describePageContract(meta, SettingsLoginPage, {
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
      prepare: ready,
      assert: async (view) => {
        expect(await view.findByText("Email, Google")).toBeVisible();
        // Null means that the workspace never chose: the portal treats it as off.
        expect(
          view.getByRole("switch", { name: "Open sign-up" }),
        ).not.toBeChecked();
        expect(
          view.getByRole("group", { name: "Workspace ID" }),
        ).toHaveTextContent("workspace_test_1");
        expect(
          view.getByRole("group", { name: "Widget signing secret" }),
        ).toHaveTextContent("wsec_0123456…");
      },
    },
    done: {
      prepare: () => {
        ready();
        api.reply(updatePortalSettingsFixture.ok({ openSignup: true }));
        api.reply(getPortalSettingsFixture.ok({ openSignup: true }));
      },
      act: async (view) => {
        fireEvent.click(
          await view.findByRole("switch", { name: "Open sign-up" }),
        );
      },
      assert: async (view) => {
        await waitFor(() =>
          expect(
            view.getByRole("switch", { name: "Open sign-up" }),
          ).toBeChecked(),
        );
        expect(
          await api.calls("updateQuillsPortalSettings")[0]!.json(),
        ).toEqual({ openSignup: true });
      },
    },
  });

  it("offers to create the first secret", async () => {
    api = mockApi();
    api.reply(getPortalSettingsFixture.ok());
    api.reply({ secret: null });
    const view = renderPage(SettingsLoginPage, meta);
    expect(
      await view.findByRole("button", { name: "Create secret" }),
    ).toBeVisible();
    expect(view.queryByText("Rotate secret")).toBeNull();
  });
});
