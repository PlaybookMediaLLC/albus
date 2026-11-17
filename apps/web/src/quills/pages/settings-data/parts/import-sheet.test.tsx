import { fireEvent, within } from "@testing-library/react";
import { describe, expect, it } from "vite-plus/test";
import { listBoardsFixture } from "../../../api/team/list-boards.fixture";
import { press } from "../../../test/actions";
import { mockApi } from "../../../test/mock-api";
import { renderComponent } from "../../../test/render";
import { TeamRuntimeProvider } from "../../../team/runtime";
import { ImportSheet } from "./import-sheet";

const team = {
  workspaceId: "workspace_1",
  viewer: { kind: "user" as const, id: "user_1" },
  permissions: {
    read: true,
    create: true,
    update: true,
    delete: true,
    manageSettings: true,
  },
};

describe("ImportSheet", () => {
  it("loads the boards only when the sheet opens and asks for a board and a file", async () => {
    const api = mockApi();
    api.reply(listBoardsFixture.ok());
    const view = renderComponent(
      <TeamRuntimeProvider value={team}>
        <ImportSheet workspaceId="workspace_1" />
      </TeamRuntimeProvider>,
    );
    expect(api.calls()).toHaveLength(0);
    fireEvent.click(view.getByRole("button", { name: /Import from CSV/ }));
    const sheet = await view.findByRole("dialog", {
      name: "Import posts from a CSV file",
    });
    expect(api.calls("listQuillsBoards")).toHaveLength(1);
    expect(within(sheet).getByText(/Required column: title/)).toBeVisible();
    press("Start import");
    expect(await within(sheet).findByText("Choose a board.")).toBeVisible();
    expect(
      within(sheet).getByText("Choose a CSV file of at most 10 MB."),
    ).toBeVisible();
    expect(api.calls("createQuillsUpload")).toHaveLength(0);
  });
});
