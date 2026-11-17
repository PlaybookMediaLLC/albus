import { fireEvent, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vite-plus/test";
import { removePostVoteFixture } from "../../../api/team/remove-post-vote.fixture";
import { votePostFixture } from "../../../api/team/vote-post.fixture";
import { TeamRuntimeProvider } from "../../../team/runtime";
import { press } from "../../../test/actions";
import { mockApi } from "../../../test/mock-api";
import { renderComponent } from "../../../test/render";
import { postDetail, postTeam, postVoters } from "../post.fixture";
import { PostVotes } from "./post-votes";

const render = (post = postDetail, team = postTeam) =>
  renderComponent(
    <TeamRuntimeProvider value={team}>
      <PostVotes workspaceId="workspace_test_1" post={post} />
    </TeamRuntimeProvider>,
  );

describe("PostVotes", () => {
  it("opens the voters from the avatar stack", async () => {
    const api = mockApi();
    api.reply(postVoters);
    // The test client refetches a stale query when the popover mounts.
    api.reply(postVoters);
    const view = render();
    fireEvent.click(
      await view.findByRole("button", { name: "Show the voters" }),
    );
    expect(await view.findByText("Linus")).toBeVisible();
  });

  it("adds the teammate's vote, and removes it with the teammate's principal", async () => {
    const api = mockApi();
    api.reply(postVoters);
    api.reply(votePostFixture.ok());
    const view = render();
    press("Add my vote (3 votes)");
    await waitFor(() => expect(api.calls("voteQuillsPost")).toHaveLength(1));
    view.unmount();
    const again = mockApi();
    again.reply(postVoters);
    again.reply(removePostVoteFixture.ok());
    const voted = render({ ...postDetail, hasVoted: true });
    const pill = voted.getByRole("button", {
      name: "Remove my vote (3 votes)",
    });
    expect(pill).toHaveAttribute("aria-pressed", "true");
    fireEvent.click(pill);
    await waitFor(() =>
      expect(again.calls("removeQuillsPostVote")).toHaveLength(1),
    );
    expect(new URL(again.calls("removeQuillsPostVote")[0]!.url).pathname).toBe(
      "/api/quills/workspace_test_1/posts/post_export/voters/principal_team",
    );
  });

  it("keeps the new state while the vote waits, even after the refreshed post arrives", async () => {
    const api = mockApi();
    api.reply(postVoters);
    api.defer(() => undefined);
    const view = render();
    press("Add my vote (3 votes)");
    const pill = await view.findByRole("button", {
      name: "Remove my vote (4 votes)",
    });
    expect(pill).toHaveAttribute("aria-pressed", "true");
    // The vote hook refetches the post first and settles after its other refetches.
    view.rerender(
      <TeamRuntimeProvider value={postTeam}>
        <PostVotes
          workspaceId="workspace_test_1"
          post={{ ...postDetail, hasVoted: true, voteCount: 4 }}
        />
      </TeamRuntimeProvider>,
    );
    expect(
      view.getByRole("button", { name: "Remove my vote (4 votes)" }),
    ).toHaveAttribute("aria-pressed", "true");
  });

  it("opens the add voter search from the kebab, only with the update permission", async () => {
    mockApi().reply(postVoters);
    const view = render();
    press("Add a vote for a customer");
    expect(
      await view.findByRole("searchbox", { name: "Add a vote for a customer" }),
    ).toBeVisible();
    view.unmount();
    mockApi().reply(postVoters);
    const reader = render(postDetail, {
      ...postTeam,
      permissions: { ...postTeam.permissions, update: false },
    });
    expect(
      reader.queryByRole("button", { name: "Add a vote for a customer" }),
    ).toBeNull();
    expect(
      reader.getByRole("button", { name: "Add my vote (3 votes)" }),
    ).toBeDisabled();
  });
});
