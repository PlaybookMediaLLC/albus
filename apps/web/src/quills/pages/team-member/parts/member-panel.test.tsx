import { describe, expect, it } from "vite-plus/test";
import { mockApi } from "../../../test/mock-api";
import { renderComponent } from "../../../test/render";
import { member, memberAttributes, inTeam } from "../member.fixture";
import { MemberPanel } from "./member-panel";

describe("MemberPanel", () => {
  it("shows the join date, the counts and leaves out the app line without an external ID", async () => {
    mockApi().reply(memberAttributes);
    const Panel = () => (
      <MemberPanel
        workspaceId="workspace_test_1"
        member={{ ...member, externalId: null }}
      />
    );
    const view = renderComponent(inTeam(<Panel />));
    expect(view.getByText("Joined")).toBeInTheDocument();
    expect(view.queryByText("Identified by your app")).toBeNull();
    for (const [label, value] of [
      ["Requests", "1"],
      ["Comments", "2"],
      ["Votes", "3"],
    ])
      expect(view.getByText(label!).nextElementSibling).toHaveTextContent(
        value!,
      );
    expect(await view.findByText("Plan:")).toBeInTheDocument();
  });
});
