import { describe, expect, it } from "vite-plus/test";
import { renderComponent } from "../../../test/render";
import { inboxPosts, inboxStatuses } from "../../team-posts/inbox.fixture";
import { RoadmapDragPreview } from "./roadmap-drag-preview";

const statuses = inboxStatuses.statuses;

describe("RoadmapDragPreview", () => {
  it("shows the whole card without its link or menu", () => {
    const post = inboxPosts.items[0]!;
    const view = renderComponent(
      <RoadmapDragPreview
        workspaceId="workspace_test_1"
        item={{ type: "card", post, statusId: "status_open", label: "x" }}
        boards={new Map([[post.boardId, "Ideas"]])}
        statuses={statuses}
      />,
    );
    const preview = view.container.firstElementChild!;
    expect(preview).toHaveAttribute("aria-hidden", "true");
    expect(preview).toHaveTextContent("Export to CSV");
    expect(preview).toHaveTextContent("Ideas");
    expect(preview.querySelector("a, button")).toBeNull();
  });

  it("shows a column by its name", () => {
    const view = renderComponent(
      <RoadmapDragPreview
        workspaceId="workspace_test_1"
        item={{ type: "column", statusId: "status_planned", label: "Planned" }}
        boards={new Map()}
        statuses={statuses}
      />,
    );
    expect(view.container.firstElementChild).toHaveTextContent("Planned");
  });
});
