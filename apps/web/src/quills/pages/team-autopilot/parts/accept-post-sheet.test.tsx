import { describe, expect, it, vi } from "vite-plus/test";
import { getBoardSettingsFixture } from "../../../api/team/get-board-settings.fixture";
import { TeamRuntimeProvider } from "../../../team/runtime";
import { mockApi } from "../../../test/mock-api";
import { renderComponent } from "../../../test/render";
import { postTeam } from "../../team-post/post.fixture";
import { signalsFixture } from "../signals.fixture";
import { AcceptPostSheet } from "./accept-post-sheet";

const boards = [{ id: "board_test_1", name: "Ideas" }];
const render = (signal: ReturnType<typeof signalsFixture.signal> | null) =>
  renderComponent(
    <TeamRuntimeProvider value={postTeam}>
      <AcceptPostSheet
        workspaceId="workspace_test_1"
        signal={signal}
        boards={boards}
        onClose={vi.fn()}
        onSubmit={vi.fn(async () => undefined)}
      />
    </TeamRuntimeProvider>,
  );

describe("AcceptPostSheet", () => {
  it("opens with the suggested title and the chosen board's fields", async () => {
    const api = mockApi();
    api.reply(
      getBoardSettingsFixture.ok({
        boardId: "board_test_1",
        customFields: [
          {
            key: "mrr",
            label: "MRR",
            type: "number",
            required: true,
            internal: true,
          },
        ],
      }),
    );
    const view = render(signalsFixture.signal());
    expect(
      await view.findByRole("dialog", { name: "Accept as a new post" }),
    ).toBeInTheDocument();
    expect(view.getByLabelText("Post title")).toHaveValue("Dark theme");
    expect(await view.findByLabelText("MRR (required)")).toBeInTheDocument();
    expect(api.calls("getQuillsBoardSettings")).toHaveLength(1);
  });

  it("stays closed without a signal and reads nothing", () => {
    const api = mockApi();
    const view = render(null);
    expect(view.queryByRole("dialog")).toBeNull();
    expect(api.calls("getQuillsBoardSettings")).toHaveLength(0);
  });
});
