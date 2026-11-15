import { fireEvent, waitFor, within } from "@testing-library/react";
import { describe, expect, it } from "vite-plus/test";
import { createBoardFixture } from "../../../api/team/create-board.fixture";
import { listBoardsFixture } from "../../../api/team/list-boards.fixture";
import { mockApi } from "../../../test/mock-api";
import { renderComponent } from "../../../test/render";
import { TeamRuntimeProvider } from "../../../team/runtime";
import { BoardsSection } from "./boards-section";

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

describe("BoardsSection", () => {
  it("creates a board from the empty state", async () => {
    const api = mockApi();
    api.reply(createBoardFixture.ok({ name: "Ideas" }));
    api.reply(listBoardsFixture.ok());
    const view = renderComponent(
      <TeamRuntimeProvider value={team}>
        <BoardsSection workspaceId="workspace_1" boards={[]} />
      </TeamRuntimeProvider>,
    );
    expect(view.getByText("No boards yet")).toBeVisible();
    fireEvent.click(view.getAllByRole("button", { name: "New board" })[0]!);
    const dialog = await view.findByRole("dialog", {
      name: "New feedback board",
    });
    fireEvent.change(within(dialog).getByLabelText("Name"), {
      target: { value: "Ideas" },
    });
    fireEvent.click(within(dialog).getByRole("button", { name: "Create" }));
    await waitFor(() => expect(api.calls("createQuillsBoard")).toHaveLength(1));
    expect(await api.calls("createQuillsBoard")[0]!.json()).toEqual({
      name: "Ideas",
    });
  });
});
