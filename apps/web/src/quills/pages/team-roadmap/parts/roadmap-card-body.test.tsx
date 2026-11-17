import {
  createMemoryHistory,
  createRootRoute,
  createRouter,
  RouterContextProvider,
} from "@tanstack/react-router";
import { fireEvent } from "@testing-library/react";
import { describe, expect, it, vi } from "vite-plus/test";
import { renderComponent } from "../../../test/render";
import { inboxPosts, inboxStatuses } from "../../team-posts/inbox.fixture";
import { RoadmapCardBody } from "./roadmap-card-body";

describe("RoadmapCardBody", () => {
  it("shows the title link with the drag instructions and the menu only with a move action", () => {
    const view = renderComponent(
      <RouterContextProvider
        router={createRouter({
          routeTree: createRootRoute(),
          history: createMemoryHistory({ initialEntries: ["/"] }),
        })}
      >
        <RoadmapCardBody
          workspaceId="workspace_test_1"
          post={inboxPosts.items[0]!}
          statusId="status_open"
          board={null}
          statuses={inboxStatuses.statuses}
          activatorRef={() => {}}
          describedBy="drag-help"
        />
      </RouterContextProvider>,
    );
    expect(view.getByRole("link", { name: "Export to CSV" })).toHaveAttribute(
      "aria-describedby",
      "drag-help",
    );
    expect(view.queryByRole("button", { name: /^Move/ })).toBeNull();
  });

  it("opens the task dialogs from the card menu", async () => {
    const onTask = vi.fn();
    const post = inboxPosts.items[0]!;
    const view = renderComponent(
      <RouterContextProvider
        router={createRouter({
          routeTree: createRootRoute(),
          history: createMemoryHistory({ initialEntries: ["/"] }),
        })}
      >
        <RoadmapCardBody
          workspaceId="workspace_test_1"
          post={post}
          statusId="status_open"
          board={null}
          statuses={inboxStatuses.statuses}
          onMove={vi.fn()}
          onTask={onTask}
        />
      </RouterContextProvider>,
    );
    fireEvent.click(view.getByRole("button", { name: "Move Export to CSV" }));
    fireEvent.click(await view.findByRole("menuitem", { name: "Create task" }));
    expect(onTask).toHaveBeenCalledWith(post, "create");
    fireEvent.click(view.getByRole("button", { name: "Move Export to CSV" }));
    fireEvent.click(
      await view.findByRole("menuitem", { name: "Link existing task" }),
    );
    expect(onTask).toHaveBeenCalledWith(post, "link");
  });
});
