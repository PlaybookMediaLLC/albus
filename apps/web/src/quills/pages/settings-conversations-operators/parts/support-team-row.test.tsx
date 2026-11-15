import { fireEvent, waitFor, within } from "@testing-library/react";
import { describe, expect, it } from "vite-plus/test";
import { listTeamsFixture } from "../../../api/team/list-teams.fixture";
import { choose } from "../../../test/actions";
import { mockApi } from "../../../test/mock-api";
import { renderComponent } from "../../../test/render";
import { TeamRuntimeProvider } from "../../../team/runtime";
import { SupportTeamRow } from "./support-team-row";

const support = {
  id: "team_1",
  name: "Billing",
  kaneoTeamId: "kaneo_team_1",
  isDefault: false,
  icon: null,
  color: null,
  description: null,
  assignmentMethod: "manual",
};

const render = () =>
  renderComponent(
    <TeamRuntimeProvider
      value={{
        workspaceId: "workspace_1",
        viewer: { kind: "user", id: "user_1" },
        permissions: {
          read: true,
          create: true,
          update: true,
          delete: true,
          manageSettings: true,
        },
      }}
    >
      <SupportTeamRow workspaceId="workspace_1" team={support} members={2} />
    </TeamRuntimeProvider>,
  );

describe("SupportTeamRow", () => {
  it("changes the assignment method", async () => {
    const api = mockApi();
    api.reply({ ...support, assignmentMethod: "balanced" });
    api.reply(listTeamsFixture.ok());
    render();
    await choose("Assignment for Billing", "Balanced");
    await waitFor(() => expect(api.calls("updateQuillsTeam")).toHaveLength(1));
    expect(await api.calls("updateQuillsTeam")[0]!.json()).toEqual({
      assignmentMethod: "balanced",
    });
  });

  it("makes the team the default and keeps its binding", async () => {
    const api = mockApi();
    api.reply({ ...support, isDefault: true });
    api.reply(listTeamsFixture.ok());
    const view = render();
    fireEvent.click(view.getByRole("button", { name: "Actions for Billing" }));
    fireEvent.click(
      await view.findByRole("menuitem", { name: "Make default" }),
    );
    await waitFor(() =>
      expect(api.calls("updateQuillsTeamBinding")).toHaveLength(1),
    );
    expect(await api.calls("updateQuillsTeamBinding")[0]!.json()).toEqual({
      kaneoTeamId: "kaneo_team_1",
      isDefault: true,
    });
  });

  it("deletes the team after a confirmation", async () => {
    const api = mockApi();
    api.reply({ id: "team_1" });
    api.reply(listTeamsFixture.ok());
    const view = render();
    fireEvent.click(view.getByRole("button", { name: "Actions for Billing" }));
    fireEvent.click(await view.findByRole("menuitem", { name: "Delete team" }));
    const dialog = await view.findByRole("alertdialog", {
      name: "Delete Billing?",
    });
    fireEvent.click(
      within(dialog).getByRole("button", { name: "Delete team" }),
    );
    await waitFor(() => expect(api.calls("deleteQuillsTeam")).toHaveLength(1));
  });
});
