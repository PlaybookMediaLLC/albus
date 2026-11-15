import { fireEvent, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vite-plus/test";
import { listPrincipalsFixture } from "../../api/team/list-principals.fixture";
import { listTeamsFixture } from "../../api/team/list-teams.fixture";
import { describePageContract } from "../../test/contracts";
import { mockApi } from "../../test/mock-api";
import { renderPage } from "../../test/render";
import { meta } from "./meta";
import { SettingsConversationsOperatorsPage } from "./settings-conversations-operators-page";

const people = listPrincipalsFixture.ok({
  items: [
    {
      id: "principal_1",
      userId: "user_1",
      name: "Ada Lovelace",
      avatarUrl: null,
      role: "owner",
      createdAt: "2026-01-01T00:00:00.000Z",
    },
  ],
});
const support = {
  id: "team_1",
  name: "Support",
  kaneoTeamId: "kaneo_team_1",
  isDefault: true,
  icon: null,
  color: null,
  description: null,
  assignmentMethod: "manual",
};

let api: ReturnType<typeof mockApi>;
const ready = () => {
  api = mockApi();
  api.reply(people);
  api.reply(
    listTeamsFixture.ok({
      teams: [support],
      members: [{ teamId: "team_1", principalId: "principal_1" }],
    }),
  );
};

describe("SettingsConversationsOperatorsPage", () => {
  describePageContract(meta, SettingsConversationsOperatorsPage, {
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
        expect(await view.findByText("Ada Lovelace")).toBeVisible();
        expect(view.getByText("owner")).toBeVisible();
        expect(view.getByText("1 teammate")).toBeVisible();
        expect(view.getByText("Default")).toBeVisible();
      },
    },
    done: {
      prepare: () => {
        ready();
        api.reply({
          principalId: "principal_1",
          availability: "away",
          changed: true,
        });
      },
      act: async (view) => {
        fireEvent.click(await view.findByRole("button", { name: "Away" }));
      },
      assert: async (view) => {
        await waitFor(() =>
          expect(view.getByRole("button", { name: "Away" })).toHaveAttribute(
            "aria-pressed",
            "true",
          ),
        );
        expect(
          await api.calls("setQuillsAgentAvailability")[0]!.json(),
        ).toEqual({ availability: "away" });
      },
    },
  });

  it("shows the empty state when no support team exists", async () => {
    api = mockApi();
    api.reply(people);
    api.reply(listTeamsFixture.ok());
    const view = renderPage(SettingsConversationsOperatorsPage, meta);
    expect(await view.findByText("No support teams yet")).toBeVisible();
  });
});
