import { describe, expect, it, vi } from "vite-plus/test";
import { createPostTaskFixture } from "../../api/team/create-post-task.fixture";
import { getBoardSettingsFixture } from "../../api/team/get-board-settings.fixture";
import { postTeam } from "../../pages/team-post/post.fixture";
import { TeamRuntimeProvider } from "../runtime";
import { press } from "../../test/actions";
import { mockApi } from "../../test/mock-api";
import { renderComponent } from "../../test/render";
import { CreateTaskDialog } from "./create-task-dialog";

const post = { id: "post_export", title: "CSV export", boardId: "board_ideas" };
const projects = [
  { id: "project_old", name: "Old", archivedAt: "2026-01-01T00:00:00.000Z" },
  { id: "project_api", name: "API", archivedAt: null },
  { id: "project_web", name: "Web", archivedAt: null },
];
const render = (onClose = vi.fn()) =>
  renderComponent(
    <TeamRuntimeProvider value={postTeam}>
      <CreateTaskDialog
        workspaceId="workspace_test_1"
        post={post}
        onClose={onClose}
      />
    </TeamRuntimeProvider>,
  );
/** Kaneo's projects, the board settings with Web as the delivery project, and Web's columns. */
const replyReads = (api: ReturnType<typeof mockApi>) => {
  api.reply(projects);
  api.reply(
    getBoardSettingsFixture.ok({
      delivery: {
        projectId: "project_web",
        columnId: null,
        priority: "medium",
        triggerStatusId: null,
      },
    }),
  );
  api.reply([{ id: "column_todo", name: "To do" }]);
};

describe("CreateTaskDialog", () => {
  it("creates the task in the board's delivery project, with the request title", async () => {
    const api = mockApi();
    replyReads(api);
    api.reply(createPostTaskFixture.ok());
    const onClose = vi.fn();
    const view = render(onClose);
    expect(
      await view.findByRole("combobox", { name: "Project" }),
    ).toHaveTextContent("Web");
    expect(view.getByLabelText("Title")).toHaveValue("CSV export");
    press("Create task");
    await vi.waitFor(() => expect(onClose).toHaveBeenCalled());
    const [request] = api.calls("createQuillsPostTask");
    expect(await request!.json()).toEqual({
      projectId: "project_web",
      columnId: null,
      title: "CSV export",
    });
  });

  it("names the project when Kaneo refuses or the project cannot take tasks", async () => {
    const api = mockApi();
    replyReads(api);
    api.reply(createPostTaskFixture.problem(409).body, 409);
    const view = render();
    await view.findByRole("combobox", { name: "Project" });
    press("Create task");
    expect(
      await view.findByText(
        "The project is archived, the column was deleted, or the plan does not include tasks.",
      ),
    ).toBeVisible();
  });
});
