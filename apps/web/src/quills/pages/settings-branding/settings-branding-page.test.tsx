import { fireEvent, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vite-plus/test";
import { getPublicPortalConfigFixture } from "../../api/portal/get-public-portal-config.fixture";
import { getBrandingSettingsFixture } from "../../api/team/get-branding-settings.fixture";
import { getPoweredByFixture } from "../../api/team/get-powered-by.fixture";
import { listCustomDomainsFixture } from "../../api/team/list-custom-domains.fixture";
import { setPoweredByFixture } from "../../api/team/set-powered-by.fixture";
import { describePageContract } from "../../test/contracts";
import { mockApi } from "../../test/mock-api";
import { renderPage } from "../../test/render";
import { meta } from "./meta";
import { SettingsBrandingPage } from "./settings-branding-page";

const hide = { name: 'Hide "Powered by"' };
const branding = getBrandingSettingsFixture.ok({
  headerDisplayMode: "logo_and_name",
  headerDisplayName: "Acme Feedback",
});

/** Answers the four reads of the page in the order of its hooks. */
function answer(showPoweredBy = true, entitled = true) {
  const api = mockApi();
  api.reply(branding);
  api.reply(
    getPublicPortalConfigFixture.ok({
      name: "Acme",
      branding: {
        logoUrl: "https://cdn.test/logo.png",
        theme: { themeMode: "user", light: {}, dark: {} },
        headerDisplayMode: "logo_and_name",
        headerDisplayName: null,
      },
    }),
  );
  api.reply(getPoweredByFixture.ok({ showPoweredBy }));
  api.reply(listCustomDomainsFixture.ok({ entitled }));
  return api;
}

let api: ReturnType<typeof mockApi>;

describe("SettingsBrandingPage", () => {
  describePageContract(meta, SettingsBrandingPage, {
    loading: {
      prepare: () => {
        const api = mockApi();
        for (let index = 0; index < 4; index += 1) api.defer(() => undefined);
      },
    },
    failed: {
      prepare: () => {
        const api = mockApi();
        for (let index = 0; index < 4; index += 1) api.fail();
      },
    },
    ready: {
      prepare: () => {
        answer();
      },
      assert: async (view) => {
        expect(await view.findByRole("switch", hide)).not.toBeChecked();
        expect(view.getByRole("textbox", { name: "Brand name" })).toHaveValue(
          "Acme Feedback",
        );
        expect(view.getByRole("img", { name: "Logo" })).toHaveAttribute(
          "src",
          "https://cdn.test/logo.png",
        );
      },
    },
    done: {
      prepare: () => {
        api = answer();
        api.reply(setPoweredByFixture.ok({ showPoweredBy: false }));
        api.reply(getPoweredByFixture.ok({ showPoweredBy: false }));
      },
      act: async (view) => {
        fireEvent.click(await view.findByRole("switch", hide));
      },
      assert: async (view) => {
        await waitFor(() =>
          expect(view.getByRole("switch", hide)).toBeChecked(),
        );
        expect(await api.calls("setQuillsPoweredBy")[0]!.json()).toEqual({
          showPoweredBy: false,
        });
      },
    },
  });

  it("locks hiding the badge without an active plan", async () => {
    answer(true, false);
    const view = renderPage(SettingsBrandingPage, meta);
    expect(await view.findByRole("switch", hide)).toHaveAttribute(
      "aria-disabled",
      "true",
    );
    expect(
      view.getByRole("img", { name: "Needs an active plan" }),
    ).toBeInTheDocument();
  });

  it("lets a workspace without a plan show the badge again", async () => {
    answer(false, false);
    const view = renderPage(SettingsBrandingPage, meta);
    expect(await view.findByRole("switch", hide)).not.toHaveAttribute(
      "aria-disabled",
      "true",
    );
  });

  it("shows the settings when only the logo read fails", async () => {
    const api = mockApi();
    api.reply(branding);
    api.reply({ message: "Not found" }, 404);
    api.reply(getPoweredByFixture.ok());
    api.reply(listCustomDomainsFixture.ok());
    const view = renderPage(SettingsBrandingPage, meta);
    expect(await view.findByRole("switch", hide)).toBeInTheDocument();
    expect(view.queryByRole("alert")).toBeNull();
  });

  it("disables the controls of a teammate without manage_settings", async () => {
    answer();
    const view = renderPage(SettingsBrandingPage, meta, {
      permissions: { manageSettings: false },
    });
    expect(await view.findByRole("switch", hide)).toHaveAttribute(
      "aria-disabled",
      "true",
    );
    expect(view.getByRole("textbox", { name: "Brand name" })).toBeDisabled();
    expect(view.getByRole("button", { name: "Upload a logo" })).toBeDisabled();
  });
});
