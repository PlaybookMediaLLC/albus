import { fireEvent, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vite-plus/test";
import { removePostVoteFixture } from "../../../api/team/remove-post-vote.fixture";
import { TeamRuntimeProvider } from "../../../team/runtime";
import { mockApi } from "../../../test/mock-api";
import { renderComponent } from "../../../test/render";
import { postDetail, postTeam, postVoters } from "../post.fixture";
import { PostVoters } from "./post-voters";

const render = (team = postTeam) =>
  renderComponent(
    <TeamRuntimeProvider value={team}>
      <PostVoters workspaceId="workspace_test_1" post={postDetail} />
    </TeamRuntimeProvider>,
  );
describe("PostVoters", () => {
  it("lists the voters and removes a vote that the team added", async () => {
    const api = mockApi();
    api.reply(postVoters);
    const view = render();
    expect(await view.findByText(/Blocker/)).toBeVisible();
    expect(view.getAllByText(/^Voted /)).toHaveLength(2);
    // A vote that a teammate added names the teammate and where they heard it.
    expect(view.getByText("Added by Grace · Call")).toBeVisible();
    expect(view.queryAllByText(/^Added by/)).toHaveLength(1);
    expect(
      view.queryByRole("button", { name: /Linus/ }),
    ).not.toBeInTheDocument();
    api.reply(removePostVoteFixture.ok());
    fireEvent.click(
      view.getByRole("button", {
        name: "Remove the vote that the team added for Margaret",
      }),
    );
    await waitFor(() =>
      expect(api.calls("removeQuillsPostVote")).toHaveLength(1),
    );
    expect(new URL(api.calls("removeQuillsPostVote")[0]!.url).pathname).toBe(
      "/api/quills/workspace_test_1/posts/post_export/voters/principal_proxy",
    );
  });

  it("hides the remove buttons without the update permission", async () => {
    mockApi().reply(postVoters);
    const view = render({
      ...postTeam,
      permissions: { ...postTeam.permissions, update: false },
    });
    await view.findByText(/Blocker/);
    expect(
      view.queryByRole("button", { name: /Remove/ }),
    ).not.toBeInTheDocument();
  });
});
