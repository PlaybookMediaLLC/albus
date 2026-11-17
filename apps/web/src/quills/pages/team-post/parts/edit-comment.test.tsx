import { fireEvent, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vite-plus/test";
import { updateCommentFixture } from "../../../api/team/update-comment.fixture";
import { TeamRuntimeProvider } from "../../../team/runtime";
import { mockApi } from "../../../test/mock-api";
import { renderComponent } from "../../../test/render";
import { postTeam } from "../post.fixture";
import { EditComment } from "./edit-comment";

const render = (onDone = vi.fn()) =>
  renderComponent(
    <TeamRuntimeProvider value={postTeam}>
      <EditComment
        workspaceId="workspace_test_1"
        commentId="comment_reply"
        content="Old text"
        onDone={onDone}
      />
    </TeamRuntimeProvider>,
  );

describe("EditComment", () => {
  it("saves the new text on Enter", async () => {
    const api = mockApi();
    api.reply(updateCommentFixture.ok());
    const onDone = vi.fn();
    const view = render(onDone);
    const box = view.getByRole("textbox", { name: "Edit" });
    expect(box).toHaveValue("Old text");
    fireEvent.change(box, { target: { value: " New text " } });
    fireEvent.keyDown(box, { key: "Enter" });
    await waitFor(() => expect(onDone).toHaveBeenCalled());
    await expect(
      api.calls("updateQuillsComment")[0]!.clone().json(),
    ).resolves.toEqual({ content: "New text" });
  });

  it("keeps the old text on Escape", () => {
    const api = mockApi();
    const onDone = vi.fn();
    const view = render(onDone);
    fireEvent.keyDown(view.getByRole("textbox", { name: "Edit" }), {
      key: "Escape",
    });
    expect(onDone).toHaveBeenCalled();
    expect(api.calls()).toHaveLength(0);
  });
});
