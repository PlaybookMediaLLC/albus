import { describe, expect, it, vi } from "vite-plus/test";
import { linkPostToTaskFixture } from "../../api/team/link-post-to-task.fixture";
import { postTeam } from "../../pages/team-post/post.fixture";
import { TeamRuntimeProvider } from "../runtime";
import { fill } from "../../test/actions";
import { mockApi } from "../../test/mock-api";
import { renderComponent } from "../../test/render";
import { LinkTaskDialog } from "./link-task-dialog";

const render = (onClose = vi.fn()) =>
  renderComponent(
    <TeamRuntimeProvider value={postTeam}>
      <LinkTaskDialog
        workspaceId="workspace_test_1"
        postId="post_export"
        onClose={onClose}
      />
    </TeamRuntimeProvider>,
  );

describe("LinkTaskDialog", () => {
  it("finds a task by key with Kaneo's search and links it", async () => {
    const api = mockApi();
    api.reply({
      results: [
        {
          id: "task_csv",
          type: "task",
          title: "Build the CSV export",
          projectName: "Web",
          projectSlug: "WEB",
          taskNumber: 12,
          createdAt: "2026-11-01T00:00:00.000Z",
          relevanceScore: 1,
        },
      ],
      totalCount: 1,
      searchQuery: "WEB-12",
    });
    api.reply(linkPostToTaskFixture.ok({ changed: true }));
    const onClose = vi.fn();
    const view = render(onClose);
    fill("Search by key or title", "WEB-12");
    (
      await view.findByRole("button", {
        name: "Link WEB-12 Build the CSV export",
      })
    ).click();
    await vi.waitFor(() => expect(onClose).toHaveBeenCalled());
    const [search] = api.calls();
    expect(new URL(search!.url).searchParams.get("type")).toBe("tasks");
    expect(api.calls("linkQuillsPostToTask")[0]!.url).toContain(
      "/posts/post_export/tasks/task_csv",
    );
  });

  it("says when no task matches", async () => {
    const api = mockApi();
    api.reply({ results: [], totalCount: 0, searchQuery: "nothing" });
    const view = render();
    fill("Search by key or title", "nothing");
    expect(await view.findByText("No task matches.")).toBeVisible();
  });
});
