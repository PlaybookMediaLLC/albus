import { fireEvent } from "@testing-library/react";
import { describe, expect, it } from "vite-plus/test";
import { getUserFixture } from "../../../api/team/get-user.fixture";
import { listUsersFixture } from "../../../api/team/list-users.fixture";
import { mockApi } from "../../../test/mock-api";
import { renderComponent } from "../../../test/render";
import { inTeam } from "../../team-member/member.fixture";
import { MoreMembers } from "./more-members";

const { segments: _segments, tags: _tags, ...person } = getUserFixture.ok();
const More = () => (
  <ul>
    <MoreMembers workspaceId="workspace_test_1" search="" offset={50} />
  </ul>
);

describe("MoreMembers", () => {
  it("sends nothing before the click, then retries a failed page", async () => {
    const api = mockApi();
    const view = renderComponent(inTeam(<More />));
    expect(api.calls()).toHaveLength(0);
    api.fail();
    fireEvent.click(view.getByRole("button", { name: "Load more members" }));
    api.reply(listUsersFixture.ok({ items: [{ ...person, name: "Bo" }] }));
    fireEvent.click(await view.findByRole("button", { name: /try again/i }));
    expect(await view.findByRole("link", { name: /Bo/ })).toBeInTheDocument();
    expect(
      view.queryByRole("button", { name: "Load more members" }),
    ).toBeNull();
  });
});
