import { describe, expect, it } from "vite-plus/test";
import { getUserFixture } from "../../../api/team/get-user.fixture";
import { renderComponent } from "../../../test/render";
import { inTeam } from "../../team-member/member.fixture";
import { MemberItems } from "./member-items";

const { segments: _segments, tags: _tags, ...person } = getUserFixture.ok();
const Items = () => (
  <ul>
    <MemberItems
      workspaceId="workspace_test_1"
      items={[{ ...person, principalId: "principal_a", name: "Ada" }]}
    />
  </ul>
);

describe("MemberItems", () => {
  it("links each member to the member detail", () => {
    const view = renderComponent(inTeam(<Items />));
    expect(view.getByRole("link", { name: /Ada/ })).toHaveAttribute(
      "href",
      "/feedback/workspace_test_1/members/principal_a",
    );
  });
});
