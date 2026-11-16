import { fireEvent, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vite-plus/test";
import { approvePostFixture } from "../../../api/team/approve-post.fixture";
import { setPostVisibilityFixture } from "../../../api/team/set-post-visibility.fixture";
import { TeamRuntimeProvider } from "../../../team/runtime";
import { press } from "../../../test/actions";
import { mockApi } from "../../../test/mock-api";
import { renderComponent } from "../../../test/render";
import { postDetail, postTeam } from "../post.fixture";
import { PostVisibility } from "./post-visibility";

const render = (post = postDetail, team = postTeam) =>
  renderComponent(
    <TeamRuntimeProvider value={team}>
      <PostVisibility workspaceId="workspace_test_1" post={post} className="" />
    </TeamRuntimeProvider>,
  );

describe("PostVisibility", () => {
  it("hides a published request from its board", async () => {
    const api = mockApi();
    api.reply(setPostVisibilityFixture.ok({ moderationState: "archived" }));
    const view = render();
    press("Visibility: On board");
    fireEvent.click(
      await view.findByRole("menuitemradio", { name: "Hidden from board" }),
    );
    await waitFor(() =>
      expect(api.calls("setQuillsPostVisibility")).toHaveLength(1),
    );
    await expect(
      api.calls("setQuillsPostVisibility")[0]!.clone().json(),
    ).resolves.toEqual({ visible: false });
  });

  it("shows a hidden request again", async () => {
    const api = mockApi();
    api.reply(setPostVisibilityFixture.ok({ moderationState: "published" }));
    const view = render({ ...postDetail, moderationState: "archived" });
    press("Visibility: Not on board");
    fireEvent.click(
      await view.findByRole("menuitemradio", { name: "Shown on board" }),
    );
    await waitFor(() =>
      expect(api.calls("setQuillsPostVisibility")).toHaveLength(1),
    );
    await expect(
      api.calls("setQuillsPostVisibility")[0]!.clone().json(),
    ).resolves.toEqual({ visible: true });
  });

  it("approves a request that waits for review to show it", async () => {
    const api = mockApi();
    api.reply(approvePostFixture.ok());
    const view = render({ ...postDetail, moderationState: "pending" });
    press("Visibility: Not on board");
    expect(
      await view.findByRole("menuitemradio", { name: "Hidden from board" }),
    ).toHaveAttribute("aria-disabled", "true");
    fireEvent.click(
      view.getByRole("menuitemradio", { name: "Shown on board" }),
    );
    await waitFor(() => expect(api.calls("approveQuillsPost")).toHaveLength(1));
  });

  it("is read-only for spam and without the update permission", () => {
    mockApi();
    const spam = render({ ...postDetail, moderationState: "spam" });
    expect(
      spam.getByRole("button", { name: "Visibility: Not on board" }),
    ).toBeDisabled();
    spam.unmount();
    const reader = render(postDetail, {
      ...postTeam,
      permissions: { ...postTeam.permissions, update: false },
    });
    expect(
      reader.getByRole("button", { name: "Visibility: On board" }),
    ).toBeDisabled();
  });
});
