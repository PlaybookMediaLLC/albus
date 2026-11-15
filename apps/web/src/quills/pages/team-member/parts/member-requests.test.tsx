import { waitFor } from "@testing-library/react";
import { describe, expect, it } from "vite-plus/test";
import { listPostsFixture } from "../../../api/team/list-posts.fixture";
import { mockApi } from "../../../test/mock-api";
import { renderComponent } from "../../../test/render";
import { inTeam } from "../member.fixture";
import {
  inboxBoards,
  inboxPosts,
  inboxStatuses,
} from "../../team-posts/inbox.fixture";
import { MemberRequests } from "./member-requests";

const Requests = () => (
  <MemberRequests workspaceId="workspace_test_1" principalId="principal_1" />
);

describe("MemberRequests", () => {
  it("says when the member wrote no request", async () => {
    const api = mockApi();
    api.reply(listPostsFixture.ok());
    api.reply(inboxStatuses);
    api.reply(inboxBoards);
    const view = renderComponent(inTeam(<Requests />));
    expect(await view.findByText("No requests yet")).toBeInTheDocument();
  });

  it("loads the next page with the cursor", async () => {
    const api = mockApi();
    api.reply({ ...inboxPosts, nextCursor: "post_sso", hasMore: true });
    api.reply(inboxStatuses);
    api.reply(inboxBoards);
    const view = renderComponent(inTeam(<Requests />));
    api.reply(listPostsFixture.ok());
    (await view.findByRole("button", { name: "Load more requests" })).click();
    await waitFor(() => expect(api.calls("listQuillsPosts")).toHaveLength(2));
    const url = new URL(api.calls("listQuillsPosts")[1]!.url);
    expect(url.searchParams.get("cursor")).toBe("post_sso");
  });
});
