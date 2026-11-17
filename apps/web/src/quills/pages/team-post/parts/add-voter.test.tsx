import { fireEvent, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vite-plus/test";
import { addPostProxyVoteFixture } from "../../../api/team/add-post-proxy-vote.fixture";
import { createUserFixture } from "../../../api/team/create-user.fixture";
import type { ListUsersResponse } from "../../../api/team/list-users";
import { listUsersFixture } from "../../../api/team/list-users.fixture";
import { TeamRuntimeProvider } from "../../../team/runtime";
import { choose } from "../../../test/actions";
import { mockApi } from "../../../test/mock-api";
import { renderComponent } from "../../../test/render";
import { postDetail, postTeam, postVoters } from "../post.fixture";
import { AddVoter } from "./add-voter";

const user: ListUsersResponse["items"][number] = {
  principalId: "principal_new",
  userId: "user_new",
  name: "Barbara",
  email: "barbara@example.test",
  contactEmail: null,
  image: null,
  emailVerified: true,
  isLead: false,
  country: null,
  locale: null,
  externalId: null,
  attributes: [],
  companyId: null,
  blockedAt: null,
  joinedAt: "2026-01-01T00:00:00.000Z",
  postCount: 0,
  commentCount: 0,
  voteCount: 0,
};
const render = () =>
  renderComponent(
    <TeamRuntimeProvider value={postTeam}>
      <AddVoter workspaceId="workspace_test_1" post={postDetail} />
    </TeamRuntimeProvider>,
  );

describe("AddVoter", () => {
  it("finds a customer and adds a vote for them", async () => {
    const api = mockApi();
    api.reply(postVoters);
    api.reply(listUsersFixture.ok({ items: [user], total: 1 }));
    api.reply(addPostProxyVoteFixture.ok());
    const view = render();
    fireEvent.change(view.getByLabelText("Add a vote for a customer"), {
      target: { value: "barb" },
    });
    fireEvent.click(
      await view.findByRole("button", { name: "Add a vote for Barbara" }),
    );
    await waitFor(() =>
      expect(api.calls("addQuillsPostProxyVote")).toHaveLength(1),
    );
    expect(
      new URL(api.calls("listQuillsUsers")[0]!.url).searchParams.get("search"),
    ).toBe("barb");
    expect(
      new URL(api.calls("addQuillsPostProxyVote")[0]!.url).searchParams.get(
        "source",
      ),
    ).toBe("other");
  });

  it("records where the teammate heard the request", async () => {
    const api = mockApi();
    api.reply(postVoters);
    api.reply(listUsersFixture.ok({ items: [user], total: 1 }));
    api.reply(addPostProxyVoteFixture.ok());
    const view = render();
    await choose("Where you heard it", "Call");
    fireEvent.change(view.getByLabelText("Add a vote for a customer"), {
      target: { value: "barb" },
    });
    fireEvent.click(
      await view.findByRole("button", { name: "Add a vote for Barbara" }),
    );
    await waitFor(() =>
      expect(api.calls("addQuillsPostProxyVote")).toHaveLength(1),
    );
    expect(
      new URL(api.calls("addQuillsPostProxyVote")[0]!.url).searchParams.get(
        "source",
      ),
    ).toBe("call");
  });

  it("creates a customer with the typed name and adds the vote", async () => {
    const api = mockApi();
    api.reply(postVoters);
    api.reply(listUsersFixture.ok({ items: [], total: 0 }));
    api.reply(createUserFixture.ok({ principalId: "principal_created" }));
    // The new customer refreshes the search before the vote is sent.
    api.reply(listUsersFixture.ok({ items: [], total: 0 }));
    api.reply(addPostProxyVoteFixture.ok());
    const view = render();
    fireEvent.change(view.getByLabelText("Add a vote for a customer"), {
      target: { value: "Dana" },
    });
    // The search runs first, after its pause.
    await waitFor(() => expect(api.calls("listQuillsUsers")).toHaveLength(1));
    fireEvent.click(view.getByRole("button", { name: "Create “Dana”" }));
    await waitFor(() =>
      expect(api.calls("addQuillsPostProxyVote")).toHaveLength(1),
    );
    await expect(
      api.calls("createQuillsUser")[0]!.clone().json(),
    ).resolves.toEqual({ name: "Dana" });
    expect(new URL(api.calls("addQuillsPostProxyVote")[0]!.url).pathname).toBe(
      "/api/quills/workspace_test_1/posts/post_export/voters/principal_created",
    );
  });
});
