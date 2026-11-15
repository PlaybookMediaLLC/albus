import { describe, expect, it } from "vite-plus/test";
import { listChangelogEngagementFixture } from "../../../api/team/list-changelog-engagement.fixture";
import { mockApi } from "../../../test/mock-api";
import { renderComponent } from "../../../test/render";
import { inTeam } from "../../team-member/member.fixture";
import { EngagementList } from "./engagement-list";

describe("EngagementList", () => {
  it("links a published update to the portal and shows its readers", async () => {
    mockApi().reply(
      listChangelogEngagementFixture.ok({
        items: [
          {
            id: "changelog_1",
            title: "November release",
            publishedAt: "2026-11-01T12:00:00.000Z",
            readCount: 4,
            reactions: [],
          },
        ],
      }),
    );
    const view = renderComponent(
      inTeam(<EngagementList workspaceId="workspace_test_1" />),
    );
    const link = await view.findByRole("link", { name: /November release/ });
    expect(link).toHaveAttribute(
      "href",
      "/portal/workspace_test_1/changelog/changelog_1",
    );
    expect(link).toHaveTextContent("4 readers");
  });
});
