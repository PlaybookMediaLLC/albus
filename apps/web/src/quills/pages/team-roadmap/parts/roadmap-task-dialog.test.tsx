import { describe, expect, it, vi } from "vite-plus/test";
import { getBoardSettingsFixture } from "../../../api/team/get-board-settings.fixture";
import { TeamRuntimeProvider } from "../../../team/runtime";
import { mockApi } from "../../../test/mock-api";
import { renderComponent } from "../../../test/render";
import { postTeam } from "../../team-post/post.fixture";
import { inboxPosts } from "../../team-posts/inbox.fixture";
import { RoadmapTaskDialog } from "./roadmap-task-dialog";

const post = inboxPosts.items[0]!;
const render = (kind: "create" | "link" | null) =>
  renderComponent(
    <TeamRuntimeProvider value={postTeam}>
      <RoadmapTaskDialog
        workspaceId="workspace_test_1"
        target={kind && { post, kind }}
        onClose={vi.fn()}
      />
    </TeamRuntimeProvider>,
  );

describe("RoadmapTaskDialog", () => {
  it("shows nothing without a target", () => {
    mockApi();
    expect(render(null).queryByRole("dialog")).toBeNull();
  });

  it("opens the create dialog for the card's request", async () => {
    const api = mockApi();
    api.reply([{ id: "project_web", name: "Web", archivedAt: null }]);
    api.reply(getBoardSettingsFixture.ok());
    api.reply([]);
    const view = render("create");
    expect(
      await view.findByRole("dialog", { name: "Create a task" }),
    ).toBeVisible();
    expect(await view.findByLabelText("Title")).toHaveValue(post.title);
  });

  it("opens the link dialog", async () => {
    mockApi();
    expect(
      await render("link").findByRole("dialog", {
        name: "Link an existing task",
      }),
    ).toBeVisible();
  });
});
