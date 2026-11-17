import { describe, expect, it } from "vite-plus/test";
import { getBoardSettingsFixture } from "../../../api/team/get-board-settings.fixture";
import { getPostFixture } from "../../../api/team/get-post.fixture";
import { TeamRuntimeProvider } from "../../../team/runtime";
import { mockApi } from "../../../test/mock-api";
import { renderComponent } from "../../../test/render";
import { postTeam } from "../post.fixture";
import { PostCustomFields } from "./post-custom-fields";

describe("PostCustomFields (team)", () => {
  it("shows each value with its label and marks internal fields", async () => {
    const api = mockApi();
    api.reply(
      getBoardSettingsFixture.ok({
        customFields: [
          {
            key: "plan",
            label: "Plan",
            type: "select",
            required: true,
            internal: false,
            options: ["Pro"],
          },
          {
            key: "mrr",
            label: "MRR",
            type: "number",
            required: false,
            internal: true,
          },
        ],
      }),
    );
    const view = renderComponent(
      <TeamRuntimeProvider value={postTeam}>
        <PostCustomFields
          workspaceId="workspace_test_1"
          post={getPostFixture.ok({
            customFields: [
              { key: "plan", value: "Pro", values: null },
              { key: "mrr", value: 1200, values: null },
            ],
          })}
        />
      </TeamRuntimeProvider>,
    );
    expect(await view.findByText("MRR (Internal)")).toBeInTheDocument();
    expect(view.getByText("Plan")).toBeInTheDocument();
    expect(view.getByText("1,200")).toBeInTheDocument();
  });

  it("renders nothing and reads nothing for a post without values", () => {
    const api = mockApi();
    const view = renderComponent(
      <TeamRuntimeProvider value={postTeam}>
        <PostCustomFields
          workspaceId="workspace_test_1"
          post={getPostFixture.ok()}
        />
      </TeamRuntimeProvider>,
    );
    expect(view.container).toBeEmptyDOMElement();
    expect(api.calls()).toHaveLength(0);
  });
});
