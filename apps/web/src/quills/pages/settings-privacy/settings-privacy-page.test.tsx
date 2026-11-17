import { fireEvent, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vite-plus/test";
import { getPortalSettingsFixture } from "../../api/team/get-portal-settings.fixture";
import { setModerationDefaultFixture } from "../../api/team/set-moderation-default.fixture";
import { updatePortalAccessFixture } from "../../api/team/update-portal-access.fixture";
import { updatePortalSettingsFixture } from "../../api/team/update-portal-settings.fixture";
import { choose } from "../../test/actions";
import { describePageContract } from "../../test/contracts";
import { mockApi } from "../../test/mock-api";
import { renderPage } from "../../test/render";
import { meta } from "./meta";
import { SettingsPrivacyPage } from "./settings-privacy-page";

const base = getPortalSettingsFixture.ok();
const portal = getPortalSettingsFixture.ok({
  moderationDefault: { ...base.moderationDefault, requireApproval: "none" },
  access: { ...base.access, visibility: "public" },
});
const privatePortal = getPortalSettingsFixture.ok({
  ...portal,
  access: {
    ...portal.access,
    visibility: "private",
    allowedDomains: ["a.test"],
  },
});

let api: ReturnType<typeof mockApi>;

describe("SettingsPrivacyPage", () => {
  describePageContract(meta, SettingsPrivacyPage, {
    loading: { prepare: () => mockApi().defer(() => undefined) },
    failed: { prepare: () => mockApi().fail() },
    ready: {
      prepare: () => mockApi().reply(portal),
      assert: async (view) => {
        expect(
          await view.findByRole("switch", { name: "Guest submissions" }),
        ).not.toBeChecked();
        expect(
          view.getByRole("combobox", { name: "Moderate submissions" }),
        ).toHaveTextContent("Off");
        expect(view.queryByLabelText("Allowed email domains")).toBeNull();
      },
    },
    done: {
      prepare: () => {
        api = mockApi();
        api.reply(portal);
        api.reply(updatePortalSettingsFixture.ok());
        api.reply({
          ...portal,
          features: { ...portal.features, allowAnonymous: true },
        });
      },
      act: async (view) => {
        fireEvent.click(
          await view.findByRole("switch", { name: "Guest submissions" }),
        );
      },
      assert: async (view) => {
        await waitFor(() =>
          expect(
            view.getByRole("switch", { name: "Guest submissions" }),
          ).toBeChecked(),
        );
        expect(
          await api.calls("updateQuillsPortalSettings")[0]!.json(),
        ).toEqual({ allowAnonymous: true });
      },
    },
  });

  it("sets the moderation default", async () => {
    api = mockApi();
    api.reply(portal);
    api.reply(setModerationDefaultFixture.ok());
    api.reply(portal);
    const view = renderPage(SettingsPrivacyPage, meta);
    await view.findByRole("combobox", { name: "Moderate submissions" });
    await choose("Moderate submissions", "Guests only");
    await waitFor(() =>
      expect(api.calls("setQuillsModerationDefault")).toHaveLength(1),
    );
    expect(await api.calls("setQuillsModerationDefault")[0]!.json()).toEqual({
      requireApproval: "anonymous",
    });
  });

  it("saves the allowed domains of a private portal", async () => {
    api = mockApi();
    api.reply(privatePortal);
    api.reply(updatePortalAccessFixture.ok());
    api.reply(privatePortal);
    const view = renderPage(SettingsPrivacyPage, meta);
    fireEvent.change(await view.findByLabelText("Allowed email domains"), {
      target: { value: "a.test, , b.test " },
    });
    fireEvent.click(view.getByRole("button", { name: "Save" }));
    await waitFor(() =>
      expect(api.calls("updateQuillsPortalAccess")).toHaveLength(1),
    );
    expect(await api.calls("updateQuillsPortalAccess")[0]!.json()).toEqual({
      visibility: "private",
      allowedDomains: ["a.test", "b.test"],
    });
  });

  it("shows the domains that the API stored after a save", async () => {
    api = mockApi();
    api.reply(privatePortal);
    api.reply(updatePortalAccessFixture.ok());
    api.reply({
      ...privatePortal,
      access: { ...privatePortal.access, allowedDomains: ["a.test", "b.test"] },
    });
    const view = renderPage(SettingsPrivacyPage, meta);
    fireEvent.change(await view.findByLabelText("Allowed email domains"), {
      target: { value: "A.test, b.TEST, not a domain" },
    });
    fireEvent.click(view.getByRole("button", { name: "Save" }));
    await waitFor(() =>
      expect(view.getByLabelText("Allowed email domains")).toHaveValue(
        "a.test, b.test",
      ),
    );
  });

  it("shows the domains as text to a teammate without manage_settings", async () => {
    mockApi().reply(privatePortal);
    const view = renderPage(SettingsPrivacyPage, meta, {
      permissions: { manageSettings: false },
    });
    expect(await view.findByText("a.test")).toBeVisible();
    expect(view.queryByRole("button", { name: "Save" })).toBeNull();
  });

  it("turns on holding likely spam for review, keeping the approval level", async () => {
    api = mockApi();
    api.reply(portal);
    api.reply(setModerationDefaultFixture.ok());
    api.reply(portal);
    const view = renderPage(SettingsPrivacyPage, meta);
    fireEvent.click(
      await view.findByRole("switch", { name: "Hold likely spam" }),
    );
    await waitFor(() =>
      expect(api.calls("setQuillsModerationDefault")).toHaveLength(1),
    );
    expect(await api.calls("setQuillsModerationDefault")[0]!.json()).toEqual({
      requireApproval: "none",
      holdSpam: true,
    });
    expect(
      view.getByRole("switch", { name: "Hold sensitive information" }),
    ).not.toBeChecked();
  });
});
