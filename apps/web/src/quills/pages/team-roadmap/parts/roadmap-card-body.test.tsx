import {
  createMemoryHistory,
  createRootRoute,
  createRouter,
  RouterContextProvider,
} from "@tanstack/react-router";
import { describe, expect, it } from "vite-plus/test";
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
});
