import { fireEvent, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vite-plus/test";
import { setPostBoardFixture } from "../../../api/team/set-post-board.fixture";
import { summarizePostFixture } from "../../../api/team/summarize-post.fixture";
import { TeamRuntimeProvider } from "../../../team/runtime";
import { press } from "../../../test/actions";
import { mockApi } from "../../../test/mock-api";
import { renderComponent } from "../../../test/render";
import { inboxBoards } from "../../team-posts/inbox.fixture";
import { postDetail, postTeam } from "../post.fixture";
import { PostChips } from "./post-chips";

const boards = [
  ...inboxBoards.items,
  { ...inboxBoards.items[0]!, id: "board_bugs", name: "Bugs" },
];
const render = (post = postDetail, team = postTeam) =>
  renderComponent(
    <TeamRuntimeProvider value={team}>
      <PostChips workspaceId="workspace_test_1" post={post} boards={boards} />
    </TeamRuntimeProvider>,
  );

describe("PostChips", () => {
  it("moves the request to another board", async () => {
    const api = mockApi();
    api.reply(setPostBoardFixture.ok());
    const view = render();
    press("Board: Ideas");
    fireEvent.click(await view.findByRole("menuitemradio", { name: "Bugs" }));
    await waitFor(() =>
      expect(api.calls("setQuillsPostBoard")).toHaveLength(1),
    );
    await expect(
      api.calls("setQuillsPostBoard")[0]!.clone().json(),
    ).resolves.toEqual({ boardId: "board_bugs" });
  });

  it("shows a request that is not public, read-only without the update permission", () => {
    mockApi();
    const view = render(
      { ...postDetail, moderationState: "pending" },
      { ...postTeam, permissions: { ...postTeam.permissions, update: false } },
    );
    expect(view.getByText("Not on board")).toBeVisible();
    expect(view.getByRole("button", { name: "Board: Ideas" })).toBeDisabled();
    expect(view.queryByRole("button", { name: "Edit tags" })).toBeNull();
  });

  it("does not carry an AI summary to the next request", async () => {
    const api = mockApi();
    api.reply(summarizePostFixture.ok({ summary: "About CSV export." }));
    const view = render();
    press("Summarize");
    expect(await view.findByText("About CSV export.")).toBeVisible();
    fireEvent.keyDown(document.activeElement ?? document.body, {
      key: "Escape",
    });
    view.rerender(
      <TeamRuntimeProvider value={postTeam}>
        <PostChips
          workspaceId="workspace_test_1"
          post={{ ...postDetail, id: "post_sso" }}
          boards={boards}
        />
      </TeamRuntimeProvider>,
    );
    await waitFor(() =>
      expect(view.queryByText("About CSV export.")).toBeNull(),
    );
    // The next request gets its own summary.
    api.reply(summarizePostFixture.ok({ summary: "About single sign-on." }));
    press("Summarize");
    expect(await view.findByText("About single sign-on.")).toBeVisible();
    expect(view.queryByText("About CSV export.")).toBeNull();
    expect(
      new URL(api.calls("summarizeQuillsPost")[1]!.url).pathname,
    ).toContain("/posts/post_sso/summary");
  });
});
