import { fireEvent, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vite-plus/test";
import { listPostViewsFixture } from "../../../api/team/list-post-views.fixture";
import { TeamRuntimeProvider } from "../../../team/runtime";
import { mockApi } from "../../../test/mock-api";
import { renderComponent } from "../../../test/render";
import { ListHeader } from "../../../ui/inbox/list-header";
import { postTeam } from "../../team-post/post.fixture";
import { inboxBoards, inboxStatuses, inboxTags } from "../inbox.fixture";
import { RequestFilterMenu } from "./request-filter-menu";

describe("RequestFilterMenu", () => {
  it("loads the tags and views only when the menu opens, and checks every board without a filter", async () => {
    const api = mockApi();
    const onSearch = vi.fn();
    const view = renderComponent(
      <TeamRuntimeProvider value={postTeam}>
        <ListHeader
          title="Requests"
          filters={
            <RequestFilterMenu
              workspaceId="workspace_test_1"
              search={{ status: "all" }}
              statuses={inboxStatuses.statuses}
              boards={[
                ...inboxBoards.items,
                { ...inboxBoards.items[0]!, id: "board_bugs", name: "Bugs" },
              ]}
              onSearch={onSearch}
            />
          }
        />
      </TeamRuntimeProvider>,
    );
    expect(api.calls()).toHaveLength(0);
    api.reply(inboxTags);
    api.reply(listPostViewsFixture.ok());
    fireEvent.click(view.getByRole("button", { name: "Filters" }));
    await waitFor(() =>
      expect(api.calls("listQuillsPostViews")).toHaveLength(1),
    );
    expect(api.calls("listQuillsTags")).toHaveLength(1);
    fireEvent.click(await view.findByRole("menuitem", { name: "Boards" }));
    // No board filter shows every board checked, so a click leaves one board out.
    const bugs = await view.findByRole("menuitemcheckbox", { name: "Bugs" });
    expect(bugs).toHaveAttribute("aria-checked", "true");
    fireEvent.click(bugs);
    expect(onSearch).toHaveBeenCalledWith({ board: "board_ideas" });
    fireEvent.click(view.getByRole("menuitem", { name: "Status" }));
    // All shows every status checked.
    expect(
      await view.findByRole("menuitemcheckbox", { name: "Planned" }),
    ).toHaveAttribute("aria-checked", "true");
  });
});
