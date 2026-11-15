import { fireEvent } from "@testing-library/react";
import { describe, expect, it } from "vite-plus/test";
import { mockApi } from "../../../test/mock-api";
import { renderComponent } from "../../../test/render";
import {
  inboxBoards,
  inboxPosts,
  inboxStatuses,
} from "../../team-posts/inbox.fixture";
import { memberComments, inTeam } from "../member.fixture";
import { MemberTabs } from "./member-tabs";

const Tabs = () => (
  <MemberTabs
    workspaceId="workspace_test_1"
    principalId="principal_1"
    postCount={2}
    commentCount={1}
  />
);

describe("MemberTabs", () => {
  it("loads a tab's list only when the tab opens", async () => {
    const api = mockApi();
    api.reply(inboxPosts);
    api.reply(inboxStatuses);
    api.reply(inboxBoards);
    const view = renderComponent(inTeam(<Tabs />));
    await view.findByRole("link", { name: /Export to CSV/ });
    expect(api.calls("listQuillsUserComments")).toHaveLength(0);
    api.reply(memberComments);
    fireEvent.click(view.getByRole("tab", { name: "Comments 1" }));
    await view.findByRole("link", { name: /Please add this/ });
    expect(api.calls("listQuillsUserComments")).toHaveLength(1);
  });
});
