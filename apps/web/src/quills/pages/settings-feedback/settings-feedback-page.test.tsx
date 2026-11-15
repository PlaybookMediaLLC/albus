import { fireEvent, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vite-plus/test";
import { getPortalSettingsFixture } from "../../api/team/get-portal-settings.fixture";
import { listBoardsFixture } from "../../api/team/list-boards.fixture";
import { listTagsFixture } from "../../api/team/list-tags.fixture";
import { updateBoardFixture } from "../../api/team/update-board.fixture";
import { updatePortalSettingsFixture } from "../../api/team/update-portal-settings.fixture";
import { describePageContract } from "../../test/contracts";
import { mockApi } from "../../test/mock-api";
import { renderPage } from "../../test/render";
import { meta } from "./meta";
import { SettingsFeedbackPage } from "./settings-feedback-page";

const nav = [
  {
    id: "roadmap",
    type: "roadmap",
    enabled: true,
    label: null,
    url: null,
    newTab: true,
  },
];
const portal = getPortalSettingsFixture.ok({ nav });
const boards = listBoardsFixture.ok({
  items: [updateBoardFixture.ok({ id: "board_1", name: "Ideas" })],
});
const tags = listTagsFixture.ok({
  tags: [
    {
      id: "tag_1",
      name: "security",
      color: "#ef4444",
      description: null,
      aiPrompt: null,
      isPublic: true,
      createdAt: "2026-01-01T00:00:00.000Z",
    },
  ],
});

let api: ReturnType<typeof mockApi>;
const ready = () => {
  api = mockApi();
  api.reply(portal);
  api.reply(boards);
  api.reply(tags);
};

describe("SettingsFeedbackPage", () => {
  describePageContract(meta, SettingsFeedbackPage, {
    loading: {
      prepare: () => {
        const api = mockApi();
        for (let index = 0; index < 3; index += 1) api.defer(() => undefined);
      },
    },
    failed: {
      prepare: () => {
        const api = mockApi();
        for (let index = 0; index < 3; index += 1) api.fail();
      },
    },
    ready: {
      prepare: ready,
      assert: async (view) => {
        expect(
          await view.findByRole("switch", { name: "Public roadmap" }),
        ).toBeChecked();
        expect(view.getByText("Ideas")).toBeVisible();
        expect(view.getByText("security")).toBeVisible();
      },
    },
    done: {
      prepare: () => {
        ready();
        api.reply(updatePortalSettingsFixture.ok());
        api.reply(
          getPortalSettingsFixture.ok({
            nav: [{ ...nav[0]!, enabled: false }],
          }),
        );
      },
      act: async (view) => {
        fireEvent.click(
          await view.findByRole("switch", { name: "Public roadmap" }),
        );
      },
      assert: async (view) => {
        await waitFor(() =>
          expect(
            view.getByRole("switch", { name: "Public roadmap" }),
          ).not.toBeChecked(),
        );
        expect(
          await api.calls("updateQuillsPortalSettings")[0]!.json(),
        ).toEqual({
          nav: [{ id: "roadmap", type: "roadmap", enabled: false }],
        });
      },
    },
  });

  it("shows the settings read-only to a teammate without manage_settings", async () => {
    ready();
    const view = renderPage(SettingsFeedbackPage, meta, {
      permissions: { manageSettings: false },
    });
    expect(
      await view.findByRole("switch", { name: "Public roadmap" }),
    ).toHaveAttribute("aria-disabled", "true");
    expect(view.queryByRole("button", { name: "New board" })).toBeNull();
    expect(view.queryByRole("button", { name: "New tag" })).toBeNull();
  });
});
