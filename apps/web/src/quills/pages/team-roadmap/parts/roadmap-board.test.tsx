import {
  createMemoryHistory,
  createRootRoute,
  createRouter,
  RouterContextProvider,
} from "@tanstack/react-router";
import { describe, expect, it } from "vite-plus/test";
import { listPostsFixture } from "../../../api/team/list-posts.fixture";
import { TeamRuntimeProvider } from "../../../team/runtime";
import { mockApi } from "../../../test/mock-api";
import { renderComponent } from "../../../test/render";
import { postTeam } from "../../team-post/post.fixture";
import { inboxStatuses } from "../../team-posts/inbox.fixture";
import { RoadmapBoard } from "./roadmap-board";

const render = (manageSettings = true) => {
  const api = mockApi();
  for (let index = 0; index < 3; index++) api.reply(listPostsFixture.ok());
  return renderComponent(
    <RouterContextProvider
      router={createRouter({
        routeTree: createRootRoute(),
        history: createMemoryHistory({ initialEntries: ["/"] }),
      })}
    >
      <TeamRuntimeProvider
        value={{
          ...postTeam,
          permissions: { ...postTeam.permissions, manageSettings },
        }}
      >
        <RoadmapBoard
          workspaceId="workspace_test_1"
          statuses={inboxStatuses.statuses}
          boards={new Map()}
          counts={new Map([["status_planned", 7]])}
        />
      </TeamRuntimeProvider>
    </RouterContextProvider>,
  );
};

describe("RoadmapBoard", () => {
  it("shows the columns in status order with their counts", () => {
    const view = render();
    expect(
      view.getAllByRole("heading", { level: 2 }).map((h) => h.textContent),
    ).toEqual(["Open", "Planned", "Complete"]);
    expect(view.getByRole("region", { name: "Planned" })).toHaveTextContent(
      "7",
    );
    expect(
      view.getByRole("button", { name: "Move the Planned column" }),
    ).toBeVisible();
  });

  it("has no column handles without the manage-settings permission", () => {
    const view = render(false);
    expect(view.queryByRole("button", { name: /column$/ })).toBeNull();
  });
});
