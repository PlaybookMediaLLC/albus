import { fireEvent, waitFor, within } from "@testing-library/react";
import { describe, expect, it } from "vite-plus/test";
import { createChangelogCategoryFixture } from "../../api/team/create-changelog-category.fixture";
import { getChangelogSettingsFixture } from "../../api/team/get-changelog-settings.fixture";
import { getPortalSettingsFixture } from "../../api/team/get-portal-settings.fixture";
import { updateChangelogSettingsFixture } from "../../api/team/update-changelog-settings.fixture";
import { listChangelogCategoriesFixture } from "../../api/team/list-changelog-categories.fixture";
import { updatePortalSettingsFixture } from "../../api/team/update-portal-settings.fixture";
import { describePageContract } from "../../test/contracts";
import { mockApi } from "../../test/mock-api";
import { renderPage } from "../../test/render";
import { meta } from "./meta";
import { SettingsChangelogPage } from "./settings-changelog-page";

const categories = listChangelogCategoriesFixture.ok({
  categories: [
    {
      id: "category_1",
      name: "Bug fix",
      color: "#22c55e",
      segmentIds: [],
      position: 0,
      createdAt: "2026-01-01T00:00:00.000Z",
    },
  ],
});

let api: ReturnType<typeof mockApi>;
const ready = () => {
  api = mockApi();
  api.reply(getPortalSettingsFixture.ok());
  api.reply(categories);
  api.reply(getChangelogSettingsFixture.ok());
};

describe("SettingsChangelogPage", () => {
  describePageContract(meta, SettingsChangelogPage, {
    loading: {
      prepare: () => {
        const api = mockApi();
        api.defer(() => undefined);
        api.defer(() => undefined);
        api.defer(() => undefined);
      },
    },
    failed: {
      prepare: () => {
        const api = mockApi();
        api.fail();
        api.fail();
        api.fail();
      },
    },
    ready: {
      prepare: ready,
      assert: async (view) => {
        // The portal shows a tab that the stored list does not name.
        expect(
          await view.findByRole("switch", { name: "Public changelog" }),
        ).toBeChecked();
        // The switch reaches every customer surface of the changelog.
        expect(
          view.getByText(
            "Show the changelog on the portal, in the widget and in the RSS feed.",
          ),
        ).toBeVisible();
        expect(view.getByText("Bug fix")).toBeVisible();
      },
    },
    done: {
      prepare: () => {
        ready();
        api.reply(updatePortalSettingsFixture.ok());
        api.reply(getPortalSettingsFixture.ok());
      },
      act: async (view) => {
        fireEvent.click(
          await view.findByRole("switch", { name: "Public changelog" }),
        );
      },
      assert: async () => {
        await waitFor(() =>
          expect(api.calls("updateQuillsPortalSettings")).toHaveLength(1),
        );
        expect(
          await api.calls("updateQuillsPortalSettings")[0]!.json(),
        ).toEqual({
          nav: [{ id: "changelog", type: "changelog", enabled: false }],
        });
      },
    },
  });

  it("turns the widget's automatic open on, off by default (#108)", async () => {
    ready();
    api.reply(updateChangelogSettingsFixture.ok({ widgetAutoOpen: true }));
    api.reply(getChangelogSettingsFixture.ok({ widgetAutoOpen: true }));
    const view = renderPage(SettingsChangelogPage, meta);
    const toggle = await view.findByRole("switch", {
      name: "Open new updates in the widget",
    });
    expect(toggle).not.toBeChecked();
    fireEvent.click(toggle);
    await waitFor(() =>
      expect(api.calls("updateQuillsChangelogSettings")).toHaveLength(1),
    );
    expect(await api.calls("updateQuillsChangelogSettings")[0]!.json()).toEqual(
      { widgetAutoOpen: true },
    );
  });

  it("shows the switch read-only without manage_settings", async () => {
    ready();
    const view = renderPage(SettingsChangelogPage, meta, {
      permissions: { manageSettings: false },
    });
    expect(
      await view.findByRole("switch", {
        name: "Open new updates in the widget",
      }),
    ).toHaveAttribute("aria-disabled", "true");
  });

  it("creates a changelog tag", async () => {
    ready();
    api.reply(createChangelogCategoryFixture.ok());
    api.reply(categories);
    const view = renderPage(SettingsChangelogPage, meta);
    fireEvent.click(await view.findByRole("button", { name: "New tag" }));
    const dialog = await view.findByRole("dialog", {
      name: "New changelog tag",
    });
    fireEvent.change(within(dialog).getByLabelText("Name"), {
      target: { value: "Security" },
    });
    fireEvent.click(within(dialog).getByRole("button", { name: "Create" }));
    await waitFor(() =>
      expect(api.calls("createQuillsChangelogCategory")).toHaveLength(1),
    );
    expect(await api.calls("createQuillsChangelogCategory")[0]!.json()).toEqual(
      { name: "Security" },
    );
  });
});
