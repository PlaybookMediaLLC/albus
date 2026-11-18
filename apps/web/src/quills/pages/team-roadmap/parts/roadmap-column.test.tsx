import { DndContext } from "@dnd-kit/core";
import {
  createMemoryHistory,
  createRootRoute,
  createRouter,
  RouterContextProvider,
} from "@tanstack/react-router";
import { fireEvent, waitFor, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vite-plus/test";
import { listPostsFixture } from "../../../api/team/list-posts.fixture";
import { TeamRuntimeProvider } from "../../../team/runtime";
import { press } from "../../../test/actions";
import { mockApi } from "../../../test/mock-api";
import { renderComponent } from "../../../test/render";
import { postTeam } from "../../team-post/post.fixture";
import { inboxStatuses } from "../../team-posts/inbox.fixture";
import { RoadmapColumn, type RoadmapColumnProps } from "./roadmap-column";

const render = (props: Partial<RoadmapColumnProps> = {}) =>
  renderComponent(
    <RouterContextProvider
      router={createRouter({
        routeTree: createRootRoute(),
        history: createMemoryHistory({ initialEntries: ["/"] }),
      })}
    >
      <TeamRuntimeProvider value={postTeam}>
        <DndContext>
          <RoadmapColumn
            workspaceId="workspace_test_1"
            status={inboxStatuses.statuses[1]!}
            progress={0.5}
            count={4}
            boards={new Map()}
            statuses={inboxStatuses.statuses}
            moves={new Map()}
            collapsed={false}
            dropTarget={false}
            onToggle={() => undefined}
            reorderable
            {...props}
          />
        </DndContext>
      </TeamRuntimeProvider>
    </RouterContextProvider>,
  );

describe("RoadmapColumn", () => {
  it("has a header with the handle, the name, the count, the menu and New request", async () => {
    const api = mockApi();
    api.reply(listPostsFixture.ok());
    const onCreate = vi.fn();
    const onToggle = vi.fn();
    const view = render({ onCreate, onToggle });
    const column = view.getByRole("region", { name: "Planned" });
    expect(within(column).getByText("4")).toBeVisible();
    expect(
      view.getByRole("button", { name: "Move the Planned column" }),
    ).toBeVisible();
    await waitFor(() => expect(api.calls("listQuillsPosts")).toHaveLength(1));
    press("New request in Planned");
    expect(onCreate).toHaveBeenCalledOnce();
    press("Options for Planned");
    fireEvent.click(await view.findByRole("menuitem", { name: "Hide column" }));
    expect(onToggle).toHaveBeenCalledOnce();
  });

  it("hides to a row with the name and the count, and loads nothing", () => {
    const api = mockApi();
    const onToggle = vi.fn();
    const view = render({ collapsed: true, onToggle, reorderable: false });
    const column = view.getByRole("region", { name: "Planned" });
    expect(within(column).getByText("4")).toBeVisible();
    expect(view.queryByRole("button", { name: /column$/ })).toBeNull();
    press("Show Planned");
    expect(onToggle).toHaveBeenCalled();
    expect(api.calls()).toHaveLength(0);
  });
});
