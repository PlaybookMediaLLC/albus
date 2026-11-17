import {
  createMemoryHistory,
  createRootRoute,
  createRouter,
  RouterContextProvider,
} from "@tanstack/react-router";
import { waitFor } from "@testing-library/react";
import { describe, expect, it } from "vite-plus/test";
import { getLinkedConversationsForPostFixture } from "../../../api/team/get-linked-conversations-for-post.fixture";
import { listPostTasksFixture } from "../../../api/team/list-post-tasks.fixture";
import { unlinkPostFromTaskFixture } from "../../../api/team/unlink-post-from-task.fixture";
import {
  TeamRuntimeProvider,
  type TeamRuntimeValue,
} from "../../../team/runtime";
import { press } from "../../../test/actions";
import { mockApi } from "../../../test/mock-api";
import { renderComponent } from "../../../test/render";
import { postTeam } from "../post.fixture";
import { PostLinks } from "./post-links";

const router = createRouter({
  routeTree: createRootRoute(),
  history: createMemoryHistory({ initialEntries: ["/"] }),
});
const post = { id: "post_export", title: "CSV export", boardId: "board_ideas" };
const render = (team: TeamRuntimeValue = postTeam) =>
  renderComponent(
    <RouterContextProvider router={router}>
      <TeamRuntimeProvider value={team}>
        <PostLinks workspaceId="workspace_test_1" post={post} />
      </TeamRuntimeProvider>
    </RouterContextProvider>,
  );
const task = {
  taskId: "task_csv",
  key: "WEB-12",
  title: "Build the CSV export",
  projectId: "project_web",
  columnName: "To do",
  columnColor: null,
  done: false,
  assigneeName: null,
  source: "manual" as const,
};

describe("PostLinks", () => {
  it("shows the tasks of this post, the hidden ones as a count, and its conversations", async () => {
    const api = mockApi();
    api.reply(listPostTasksFixture.ok({ items: [task], hidden: 2 }));
    api.reply(
      getLinkedConversationsForPostFixture.ok({
        items: [
          { conversationId: "conv_1", subject: "CSV please", status: "open" },
          { conversationId: "conv_2", subject: null, status: "closed" },
        ],
      }),
    );
    const view = render();
    expect(
      await view.findByRole("link", { name: "WEB-12 Build the CSV export" }),
    ).toBeVisible();
    expect(
      view.getByText("2 tasks in projects that you cannot open"),
    ).toBeVisible();
    expect(view.getByRole("link", { name: "CSV please" })).toHaveAttribute(
      "href",
      "/feedback/workspace_test_1/conversations/conv_1",
    );
    expect(view.getByRole("link", { name: "No subject" })).toBeVisible();
    expect(view.getByRole("button", { name: "Create task" })).toBeVisible();
    expect(
      view.getByRole("button", { name: "Link existing task" }),
    ).toBeVisible();
    expect(api.calls()).toHaveLength(2);
  });

  it("unlinks a task", async () => {
    const api = mockApi();
    api.reply(listPostTasksFixture.ok({ items: [task] }));
    api.reply(getLinkedConversationsForPostFixture.ok());
    api.reply(unlinkPostFromTaskFixture.ok({ changed: true }));
    api.reply(listPostTasksFixture.ok());
    const view = render();
    await view.findByRole("link", { name: "WEB-12 Build the CSV export" });
    press("Unlink Build the CSV export");
    // The list reloads after the unlink and shows none.
    await waitFor(() => expect(view.getAllByText("None")).toHaveLength(2));
    expect(api.calls("unlinkQuillsPostFromTask")).toHaveLength(1);
  });

  it("hides the task actions without the update permission", async () => {
    const api = mockApi();
    api.reply(listPostTasksFixture.ok({ items: [task] }));
    api.reply(getLinkedConversationsForPostFixture.ok());
    const view = render({
      ...postTeam,
      permissions: { ...postTeam.permissions, update: false },
    });
    await view.findByRole("link", { name: "WEB-12 Build the CSV export" });
    expect(view.queryByRole("button", { name: "Create task" })).toBeNull();
    expect(view.queryByRole("button", { name: /Unlink/ })).toBeNull();
  });

  it("says when nothing is linked and when the links fail", async () => {
    const api = mockApi();
    api.fail();
    api.reply(getLinkedConversationsForPostFixture.ok());
    const view = render();
    expect(await view.findByRole("alert")).toHaveTextContent("went wrong");
    expect(view.getAllByText("None")).toHaveLength(2);
  });
});
