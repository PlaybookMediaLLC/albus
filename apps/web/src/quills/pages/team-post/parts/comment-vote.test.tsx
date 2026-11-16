import { fireEvent, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vite-plus/test";
import { removeCommentReactionFixture } from "../../../api/team/remove-comment-reaction.fixture";
import { setCommentReactionFixture } from "../../../api/team/set-comment-reaction.fixture";
import { TeamRuntimeProvider } from "../../../team/runtime";
import { mockApi } from "../../../test/mock-api";
import { renderComponent } from "../../../test/render";
import { postTeam } from "../post.fixture";
import { CommentVote } from "./comment-vote";

const vote = (reacted: boolean, count = 2) => (
  <TeamRuntimeProvider value={postTeam}>
    <CommentVote
      workspaceId="workspace_test_1"
      commentId="comment_customer"
      reactions={[
        { emoji: "❤️", count: 4, reacted: false },
        { emoji: "👍", count, reacted },
      ]}
    />
  </TeamRuntimeProvider>
);
const render = (reacted: boolean) => renderComponent(vote(reacted));

describe("CommentVote", () => {
  it("counts the 👍 votes and adds the teammate's vote", async () => {
    const api = mockApi();
    api.reply(setCommentReactionFixture.ok());
    const view = render(false);
    const pill = view.getByRole("button", { name: "2 votes for this comment" });
    expect(pill).toHaveAttribute("aria-pressed", "false");
    fireEvent.click(pill);
    await waitFor(() =>
      expect(api.calls("setQuillsCommentReaction")).toHaveLength(1),
    );
    const url = new URL(api.calls("setQuillsCommentReaction")[0]!.url);
    expect(url.pathname).toBe(
      "/api/quills/workspace_test_1/comments/comment_customer/reactions",
    );
    expect(url.searchParams.get("emoji")).toBe("👍");
  });

  it("keeps the new state while the vote waits, even after the refreshed comments arrive", async () => {
    const api = mockApi();
    api.defer(() => undefined);
    const view = render(false);
    fireEvent.click(
      view.getByRole("button", { name: "2 votes for this comment" }),
    );
    const pill = await view.findByRole("button", {
      name: "3 votes for this comment",
    });
    expect(pill).toHaveAttribute("aria-pressed", "true");
    view.rerender(vote(true, 3));
    expect(
      view.getByRole("button", { name: "3 votes for this comment" }),
    ).toHaveAttribute("aria-pressed", "true");
  });

  it("removes the teammate's vote", async () => {
    const api = mockApi();
    api.reply(removeCommentReactionFixture.ok());
    const view = render(true);
    fireEvent.click(
      view.getByRole("button", { name: "2 votes for this comment" }),
    );
    await waitFor(() =>
      expect(api.calls("removeQuillsCommentReaction")).toHaveLength(1),
    );
  });
});
