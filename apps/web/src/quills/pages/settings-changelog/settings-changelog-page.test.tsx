import { fireEvent, waitFor, within } from "@testing-library/react";
import { describe, expect, it } from "vite-plus/test";
import { createChangelogCategoryFixture } from "../../api/team/create-changelog-category.fixture";
import { getPortalSettingsFixture } from "../../api/team/get-portal-settings.fixture";
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
};

describe("SettingsChangelogPage", () => {
  describePageContract(meta, SettingsChangelogPage, {
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
        // The portal shows a tab that the stored list does not name.
        expect(
          await view.findByRole("switch", { name: "Public changelog" }),
        ).toBeChecked();
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
