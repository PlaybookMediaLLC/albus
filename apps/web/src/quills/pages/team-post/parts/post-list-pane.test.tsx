import {
  createMemoryHistory,
  createRootRoute,
  createRouter,
  RouterContextProvider,
} from "@tanstack/react-router";
import { fireEvent } from "@testing-library/react";
import { describe, expect, it, vi } from "vite-plus/test";
import { setPostScoreFixture } from "../../../api/team/set-post-score.fixture";
import { listStatusesFixture } from "../../../api/team/list-statuses.fixture";
import { TeamRuntimeProvider } from "../../../team/runtime";
import { renderComponent } from "../../../test/render";
import { inboxBoards } from "../../team-posts/inbox.fixture";
import { postTeam } from "../post.fixture";
import { PostListPane } from "./post-list-pane";

const post = {
  ...setPostScoreFixture.ok({ title: "Request 1" }),
  demand: {
    voters: 0,
    companies: 0,
    mrrCents: 0,
    importance: { nice: 0, important: 0, critical: 0 },
  },
  teamScore: null,
};

// The Triage pill is a router link.
const router = () =>
  createRouter({
    routeTree: createRootRoute(),
    history: createMemoryHistory({
      initialEntries: ["/feedback/workspace_test_1/posts/post_2"],
    }),
  });

describe("PostListPane", () => {
  it("shows compact cards with the open post selected, and the search", () => {
    const onOpen = vi.fn();
    const pair = [
      { ...post, id: "post_1" },
      { ...post, id: "post_2", title: "Request 2" },
    ];
    const view = renderComponent(
      <RouterContextProvider router={router()}>
        <TeamRuntimeProvider value={postTeam}>
          <PostListPane
            workspaceId="workspace_test_1"
            posts={pair}
            statuses={listStatusesFixture.ok().statuses}
            boards={inboxBoards.items}
            search={{ q: "csv" }}
            onSearch={vi.fn()}
            activeId="post_2"
            href={(id) => `/feedback/workspace_test_1/posts/${id}`}
            onOpen={onOpen}
            loading={false}
          />
        </TeamRuntimeProvider>
      </RouterContextProvider>,
    );
    expect(
      view.getByRole("heading", { level: 2, name: "Requests" }),
    ).toBeVisible();
    expect(
      view.getByRole("searchbox", { name: "Search requests…" }),
    ).toHaveValue("csv");
    const open = view.getByRole("link", { name: /Request 2/ });
    expect(open).toHaveAttribute("aria-current", "true");
    expect(open).toHaveAttribute(
      "href",
      "/feedback/workspace_test_1/posts/post_2",
    );
    fireEvent.click(view.getByRole("link", { name: /Request 1/ }));
    expect(onOpen).toHaveBeenCalledWith("post_1");
    expect(view.getByRole("link", { name: "Triage" })).toHaveAttribute(
      "href",
      "/feedback/workspace_test_1/triage",
    );
  });

  it("names the chosen status in the title, like the list page", () => {
    const statuses = listStatusesFixture.ok({
      statuses: [
        {
          id: "status_planned",
          name: "Planned",
          slug: "planned",
          color: "purple",
          category: "active",
          position: 0,
          showOnRoadmap: true,
          isDefault: false,
          createdAt: "2026-01-01T00:00:00.000Z",
        },
      ],
    }).statuses;
    const view = renderComponent(
      <RouterContextProvider router={router()}>
        <TeamRuntimeProvider value={postTeam}>
          <PostListPane
            workspaceId="workspace_test_1"
            posts={[]}
            statuses={statuses}
            boards={inboxBoards.items}
            search={{ statusId: "status_planned" }}
            onSearch={vi.fn()}
            activeId=""
            href={(id) => `/feedback/workspace_test_1/posts/${id}`}
            onOpen={vi.fn()}
            loading={false}
          />
        </TeamRuntimeProvider>
      </RouterContextProvider>,
    );
    expect(
      view.getByRole("heading", { level: 2, name: "Planned" }),
    ).toBeVisible();
  });
});
