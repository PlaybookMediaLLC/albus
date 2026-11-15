import { describe, expect, it } from "vite-plus/test";
import { listUserCommentsFixture } from "../../../api/team/list-user-comments.fixture";
import { mockApi } from "../../../test/mock-api";
import { renderComponent } from "../../../test/render";
import { memberComments, inTeam } from "../member.fixture";
import { MemberComments } from "./member-comments";

const Comments = () => (
  <MemberComments workspaceId="workspace_test_1" principalId="principal_1" />
);

describe("MemberComments", () => {
  it("says when the member wrote no comment", async () => {
    mockApi().reply(listUserCommentsFixture.ok());
    const view = renderComponent(inTeam(<Comments />));
    expect(await view.findByText("No comments yet")).toBeInTheDocument();
  });

  it("shows a failed list with a retry", async () => {
    const api = mockApi();
    api.fail();
    const view = renderComponent(inTeam(<Comments />));
    api.reply(memberComments);
    (await view.findByRole("button", { name: /try again/i })).click();
    expect(
      await view.findByRole("link", { name: /Please add this/ }),
    ).toBeInTheDocument();
  });
});
