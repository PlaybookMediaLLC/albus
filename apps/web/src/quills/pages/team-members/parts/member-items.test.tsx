import { describe, expect, it } from "vite-plus/test";
import { getUserFixture } from "../../../api/team/get-user.fixture";
import { renderPage } from "../../../test/render";
import { meta } from "../meta";
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
    const view = renderPage(Items, meta);
    expect(view.getByRole("link", { name: /Ada/ })).toHaveAttribute(
      "href",
      "/feedback/workspace_test_1/members/principal_a",
    );
  });
});
