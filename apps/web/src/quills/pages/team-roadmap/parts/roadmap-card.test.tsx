import { DndContext } from "@dnd-kit/core";
import {
  createMemoryHistory,
  createRootRoute,
  createRouter,
  RouterContextProvider,
} from "@tanstack/react-router";
import { fireEvent } from "@testing-library/react";
import { describe, expect, it, vi } from "vite-plus/test";
import { press } from "../../../test/actions";
import { renderComponent } from "../../../test/render";
import { inboxPosts, inboxStatuses } from "../../team-posts/inbox.fixture";
import { RoadmapCard } from "./roadmap-card";

const render = (
  onMove?: (post: unknown, statusId: string, byMenu?: boolean) => void,
  focus?: { onFocused: () => void },
) =>
  renderComponent(
    <RouterContextProvider
      router={createRouter({
        routeTree: createRootRoute(),
        history: createMemoryHistory({ initialEntries: ["/"] }),
      })}
    >
      <DndContext>
        <RoadmapCard
          workspaceId="workspace_test_1"
          post={{ ...inboxPosts.items[0]!, content: "**Bulk** export" }}
          statusId="status_open"
          board="Ideas"
          statuses={inboxStatuses.statuses}
          onMove={onMove}
          focus={Boolean(focus)}
          onFocused={focus?.onFocused}
        />
      </DndContext>
    </RouterContextProvider>,
  );

describe("RoadmapCard", () => {
  it("shows the board, the plain-text title link, the counts and the creation month", () => {
    const view = render();
    expect(view.getByRole("link", { name: "Export to CSV" })).toHaveAttribute(
      "href",
      "/feedback/workspace_test_1/posts/post_export",
    );
    const card = view.getByRole("article");
    expect(card).toHaveTextContent(/Created \w{3} \d{4}/);
    expect(card).not.toHaveTextContent("**");
    expect(card).toHaveTextContent("Ideas");
    expect(card).toHaveTextContent("3 votes");
    expect(card).toHaveTextContent("0 comments");
  });

  it("moves the card to the status chosen in its menu", async () => {
    const onMove = vi.fn();
    const view = render(onMove);
    press("Move Export to CSV");
    fireEvent.click(
      await view.findByRole("menuitemradio", { name: "Complete" }),
    );
    expect(onMove).toHaveBeenCalledWith(
      expect.objectContaining({ id: "post_export" }),
      "status_done",
      true,
    );
  });

  it("takes the keyboard focus when it mounts after a move by its menu", () => {
    const onFocused = vi.fn();
    const view = render(vi.fn(), { onFocused });
    expect(view.getByRole("link", { name: "Export to CSV" })).toHaveFocus();
    expect(onFocused).toHaveBeenCalledOnce();
  });

  it("has no move menu without the update permission", () => {
    const view = render();
    expect(view.queryByRole("button", { name: /^Move/ })).toBeNull();
  });
});
