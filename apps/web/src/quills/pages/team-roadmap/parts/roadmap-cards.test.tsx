import { DndContext } from "@dnd-kit/core";
import {
  createMemoryHistory,
  createRootRoute,
  createRouter,
  RouterContextProvider,
} from "@tanstack/react-router";
import { describe, expect, it } from "vite-plus/test";
import { listPostsFixture } from "../../../api/team/list-posts.fixture";
import { TeamRuntimeProvider } from "../../../team/runtime";
import { press } from "../../../test/actions";
import { mockApi } from "../../../test/mock-api";
import { renderComponent } from "../../../test/render";
import { postTeam } from "../../team-post/post.fixture";
import { inboxPosts, inboxStatuses } from "../../team-posts/inbox.fixture";
import type { PendingMove } from "../roadmap-moves";
import { RoadmapCards } from "./roadmap-cards";

const [exportPost, ssoPost] = inboxPosts.items;
const render = (moves: ReadonlyMap<string, PendingMove> = new Map()) =>
  renderComponent(
    <RouterContextProvider
      router={createRouter({
        routeTree: createRootRoute(),
        history: createMemoryHistory({ initialEntries: ["/"] }),
      })}
    >
      <TeamRuntimeProvider value={postTeam}>
        <DndContext>
          <RoadmapCards
            workspaceId="workspace_test_1"
            statusId="status_planned"
            boards={new Map()}
            statuses={inboxStatuses.statuses}
            moves={moves}
          />
        </DndContext>
      </TeamRuntimeProvider>
    </RouterContextProvider>,
  );

describe("RoadmapCards", () => {
  it("lists the posts of the status by votes, with a card that moves in", async () => {
    const api = mockApi();
    api.reply(listPostsFixture.ok({ items: [ssoPost!] }));
    const view = render(
      new Map([[exportPost!.id, { post: exportPost!, to: "status_planned" }]]),
    );
    await view.findByRole("link", { name: "Single sign-on" });
    expect(view.getAllByRole("link").map((link) => link.textContent)).toEqual([
      "Export to CSV",
      "Single sign-on",
    ]);
    const query = new URL(api.calls("listQuillsPosts")[0]!.url).searchParams;
    expect(query.get("statusIds")).toBe("status_planned");
    expect(query.get("sort")).toBe("votes");
  });

  it("shows more posts when the user asks", async () => {
    const api = mockApi();
    api.reply(
      listPostsFixture.ok({
        items: [ssoPost!],
        nextCursor: "post_sso",
        hasMore: true,
      }),
    );
    api.reply(listPostsFixture.ok({ items: [exportPost!] }));
    const view = render();
    await view.findByRole("link", { name: "Single sign-on" });
    press("Show more");
    expect(
      await view.findByRole("link", { name: "Export to CSV" }),
    ).toBeVisible();
    const query = new URL(api.calls("listQuillsPosts")[1]!.url).searchParams;
    expect(query.get("cursor")).toBe("post_sso");
    expect(view.queryByRole("button", { name: "Show more" })).toBeNull();
  });
});
