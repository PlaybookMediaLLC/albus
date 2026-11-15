import {
  createMemoryHistory,
  createRootRoute,
  createRouter,
  RouterContextProvider,
} from "@tanstack/react-router";
import { fireEvent, waitFor, within } from "@testing-library/react";
import { describe, expect, it } from "vite-plus/test";
import { listBoardsFixture } from "../../../api/team/list-boards.fixture";
import { updateBoardFixture } from "../../../api/team/update-board.fixture";
import { choose } from "../../../test/actions";
import { mockApi } from "../../../test/mock-api";
import { renderComponent } from "../../../test/render";
import { TeamRuntimeProvider } from "../../../team/runtime";
import { BoardRow } from "./board-row";

const board = {
  ...updateBoardFixture.ok({ id: "board_1", name: "Ideas" }),
  access: {
    ...updateBoardFixture.ok().access,
    vote: "authenticated" as const,
  },
};

const render = (value = board, manageSettings = true) => {
  const router = createRouter({
    routeTree: createRootRoute(),
    history: createMemoryHistory({
      initialEntries: ["/feedback/workspace_1/settings/feedback"],
    }),
  });
  const view = renderComponent(
    <RouterContextProvider router={router}>
      <TeamRuntimeProvider
        value={{
          workspaceId: "workspace_1",
          viewer: { kind: "user", id: "user_1" },
          permissions: {
            read: true,
            create: true,
            update: true,
            delete: true,
            manageSettings,
          },
        }}
      >
        <BoardRow workspaceId="workspace_1" board={value} />
      </TeamRuntimeProvider>
    </RouterContextProvider>,
  );
  return { view, router };
};

describe("BoardRow", () => {
  it("sends the full access with the new view and no more open action", async () => {
    const api = mockApi();
    api.reply(updateBoardFixture.ok());
    api.reply(listBoardsFixture.ok());
    render();
    await choose("Who can see Ideas", "Team only");
    await waitFor(() => expect(api.calls("updateQuillsBoard")).toHaveLength(1));
    expect(await api.calls("updateQuillsBoard")[0]!.json()).toEqual({
      access: {
        ...board.access,
        view: "team",
        vote: "team",
        comment: "team",
        submit: "team",
      },
    });
  });

  it("opens the voting and task sync settings", async () => {
    mockApi();
    const { view, router } = render();
    fireEvent.click(view.getByRole("button", { name: "Actions for Ideas" }));
    fireEvent.click(
      await view.findByRole("menuitem", { name: "Voting and task sync" }),
    );
    await waitFor(() =>
      expect(router.history.location.pathname).toBe(
        "/feedback/workspace_1/settings/boards",
      ),
    );
  });

  it("deletes the board after a confirmation", async () => {
    const api = mockApi();
    api.reply({ id: "board_1", deletedAt: board.createdAt, unmerged: [] });
    api.reply(listBoardsFixture.ok());
    const { view } = render();
    fireEvent.click(view.getByRole("button", { name: "Actions for Ideas" }));
    fireEvent.click(
      await view.findByRole("menuitem", { name: "Delete board" }),
    );
    const dialog = await view.findByRole("alertdialog", {
      name: "Delete Ideas?",
    });
    fireEvent.click(
      within(dialog).getByRole("button", { name: "Delete board" }),
    );
    await waitFor(() => expect(api.calls("deleteQuillsBoard")).toHaveLength(1));
  });

  it("keeps a segment board read-only here, and hides the menu without manage_settings", () => {
    mockApi();
    const { view } = render(
      { ...board, access: { ...board.access, view: "segments" } },
      false,
    );
    expect(
      view.getByRole("combobox", { name: "Who can see Ideas" }),
    ).toHaveTextContent("Segments");
    expect(
      view.queryByRole("button", { name: "Actions for Ideas" }),
    ).toBeNull();
  });
});
