import { fireEvent, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vite-plus/test";
import { createPostViewFixture } from "../../api/team/create-post-view.fixture";
import { listPostViewsFixture } from "../../api/team/list-post-views.fixture";
import { TeamRuntimeProvider, type TeamRuntimeValue } from "../../team/runtime";
import { fill, press } from "../../test/actions";
import { mockApi } from "../../test/mock-api";
import { renderComponent } from "../../test/render";
import { ListHeader } from "../../ui/inbox/list-header";
import { postTeam } from "../team-post/post.fixture";
import { inboxBoards, inboxStatuses, inboxTags } from "./inbox.fixture";
import { useRequestFilters } from "./use-request-filters";

function Harness() {
  const menu = useRequestFilters({
    workspaceId: "workspace_test_1",
    search: { board: "board_ideas", sort: "oldest" },
    statuses: inboxStatuses.statuses,
    boards: inboxBoards.items,
    onSearch: vi.fn(),
  });
  return (
    <>
      <ListHeader title="Requests" filters={menu.filters} />
      {menu.dialog}
    </>
  );
}
const render = (team: TeamRuntimeValue = postTeam) =>
  renderComponent(
    <TeamRuntimeProvider value={team}>
      <Harness />
    </TeamRuntimeProvider>,
  );

describe("useRequestFilters", () => {
  it("saves the list filters as a named view", async () => {
    const api = mockApi();
    api.reply(inboxTags);
    api.reply(listPostViewsFixture.ok());
    const view = render();
    press("Filters");
    fireEvent.click(
      await view.findByRole("menuitem", { name: "Save as view…" }),
    );
    await view.findByRole("dialog");
    fill("Name", "Old ideas");
    api.reply(createPostViewFixture.ok());
    press("Save view");
    await waitFor(() =>
      expect(api.calls("createQuillsPostView")).toHaveLength(1),
    );
    await expect(
      api.calls("createQuillsPostView")[0]!.clone().json(),
    ).resolves.toEqual({
      name: "Old ideas",
      filters: {
        status: ["status_open", "status_planned"],
        board: ["board_ideas"],
        sort: "oldest",
      },
    });
  });

  it("leaves out Save as view without the create permission", async () => {
    const api = mockApi();
    api.reply(inboxTags);
    api.reply(listPostViewsFixture.ok());
    const view = render({
      ...postTeam,
      permissions: { ...postTeam.permissions, create: false },
    });
    press("Filters");
    await view.findByRole("menuitem", { name: "Clear" });
    expect(view.queryByRole("menuitem", { name: "Save as view…" })).toBeNull();
  });
});
