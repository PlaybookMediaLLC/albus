import { fireEvent, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vite-plus/test";
import { disableHelpCenterLocaleFixture } from "../../api/team/disable-help-center-locale.fixture";
import { getHelpCenterSettingsFixture } from "../../api/team/get-help-center-settings.fixture";
import { describePageContract } from "../../test/contracts";
import { mockApi } from "../../test/mock-api";
import { renderPage } from "../../test/render";
import { meta } from "./meta";
import { SettingsLanguagesPage } from "./settings-languages-page";

const settings = (additional: string[]) =>
  getHelpCenterSettingsFixture.ok({
    locales: {
      default: "en",
      additional,
      chrome: additional.map((locale) => ({
        locale,
        homepageTitle: "Hilfe",
        homepageDescription: "",
        searchPlaceholder: "",
      })),
    },
  });

let api: ReturnType<typeof mockApi>;

describe("SettingsLanguagesPage", () => {
  describePageContract(meta, SettingsLanguagesPage, {
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
        mockApi().reply(settings(["de"]));
      },
      assert: async (view) => {
        expect(await view.findByText("English")).toBeInTheDocument();
        expect(view.getByText("German")).toBeInTheDocument();
      },
    },
    done: {
      prepare: () => {
        api = mockApi();
        api.reply(settings(["de"]));
        api.reply(disableHelpCenterLocaleFixture.ok(settings([])));
        api.reply(settings([]));
      },
      act: async (view) => {
        fireEvent.click(
          await view.findByRole("button", { name: "Actions for German" }),
        );
        fireEvent.click(await view.findByRole("menuitem", { name: "Remove" }));
      },
      assert: async (view) => {
        expect(
          await view.findByText("No other languages yet"),
        ).toBeInTheDocument();
        const [call] = api.calls("disableQuillsHelpCenterLocale");
        expect(new URL(call!.url).searchParams.get("locale")).toBe("de");
      },
    },
  });

  it("offers only the languages that are not enabled", async () => {
    mockApi().reply(settings(["de"]));
    const view = renderPage(SettingsLanguagesPage, meta);
    // The button stays disabled until the enabled languages are known.
    await view.findByText("German");
    fireEvent.click(view.getByRole("button", { name: "Add language" }));
    fireEvent.click(await view.findByRole("combobox", { name: "Language" }));
    expect(await view.findByRole("option", { name: "French" })).toBeVisible();
    expect(view.queryByRole("option", { name: "German" })).toBeNull();
    expect(view.queryByRole("option", { name: "English" })).toBeNull();
  });

  it("hides the add button and the row actions without manage_settings", async () => {
    mockApi().reply(settings(["de"]));
    const view = renderPage(SettingsLanguagesPage, meta, {
      permissions: { manageSettings: false },
    });
    await waitFor(() => expect(view.getByText("German")).toBeInTheDocument());
    expect(view.queryByRole("button", { name: "Add language" })).toBeNull();
    expect(
      view.queryByRole("button", { name: "Actions for German" }),
    ).toBeNull();
  });
});
