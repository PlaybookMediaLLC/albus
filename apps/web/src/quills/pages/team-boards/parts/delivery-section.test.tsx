import { describe, expect, it } from "vite-plus/test";
import { waitFor } from "@testing-library/react";
import { setBoardDeliveryFixture } from "../../../api/team/set-board-delivery.fixture";
import { TeamRuntimeProvider } from "../../../team/runtime";
import { choose, press } from "../../../test/actions";
import { mockApi } from "../../../test/mock-api";
import { renderComponent } from "../../../test/render";
import { postTeam } from "../../team-post/post.fixture";
import { DeliverySection } from "./delivery-section";

const render = () =>
  renderComponent(
    <TeamRuntimeProvider value={postTeam}>
      <DeliverySection
        workspaceId="workspace_test_1"
        boardId="board_ideas"
        delivery={null}
        statuses={[{ id: "status_planned", name: "Planned" }]}
      />
    </TeamRuntimeProvider>,
  );

describe("DeliverySection", () => {
  it("names the project when Kaneo refuses task:create there", async () => {
    const api = mockApi();
    api.reply([{ id: "project_web", name: "Web", archivedAt: null }]);
    api.reply([]);
    api.reply(setBoardDeliveryFixture.problem(403).body, 403);
    const view = render();
    const trigger =
      "When a teammate moves a request to this status, create a task as them";
    await view.findByRole("combobox", { name: trigger });
    await choose(trigger, "Planned");
    press("Save delivery");
    expect(
      await view.findByText("You cannot create tasks in this project."),
    ).toBeVisible();
    await waitFor(() =>
      expect(api.calls("setQuillsBoardDelivery")).toHaveLength(1),
    );
  });
});
