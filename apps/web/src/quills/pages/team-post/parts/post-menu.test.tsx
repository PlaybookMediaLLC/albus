import { fireEvent, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vite-plus/test";
import { previewPostUpdateFixture } from "../../../api/team/preview-post-update.fixture";
import { TeamRuntimeProvider } from "../../../team/runtime";
import { press } from "../../../test/actions";
import { mockApi } from "../../../test/mock-api";
import { renderComponent } from "../../../test/render";
import { postTeam } from "../post.fixture";
import { PostMenu } from "./post-menu";

const render = (team = postTeam) =>
  renderComponent(
    <TeamRuntimeProvider value={team}>
      <PostMenu
        workspaceId="workspace_test_1"
        postId="post_export"
        title="Export to CSV"
        onDeleted={vi.fn()}
      />
    </TeamRuntimeProvider>,
  );

describe("PostMenu", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("copies the portal link of the request", async () => {
    const writeText = vi.fn(async () => undefined);
    vi.stubGlobal("navigator", { ...navigator, clipboard: { writeText } });
    const view = render();
    press("More actions");
    fireEvent.click(await view.findByRole("menuitem", { name: "Copy link" }));
    await waitFor(() =>
      expect(writeText).toHaveBeenCalledWith(
        `${window.location.origin}/portal/workspace_test_1/posts/post_export`,
      ),
    );
  });

  it("opens the portal page and asks before a delete", async () => {
    const open = vi.spyOn(window, "open").mockReturnValue(null);
    const view = render();
    press("More actions");
    fireEvent.click(await view.findByRole("menuitem", { name: "Visit" }));
    expect(open).toHaveBeenCalledWith(
      `${window.location.origin}/portal/workspace_test_1/posts/post_export`,
      "_blank",
      "noopener",
    );
    press("More actions");
    fireEvent.click(await view.findByRole("menuitem", { name: "Delete" }));
    expect(
      await view.findByRole("dialog", { name: "Delete this request?" }),
    ).toBeVisible();
    open.mockRestore();
  });

  it("opens Send update only with update and manage_settings", async () => {
    const api = mockApi();
    api.reply({ segments: [] });
    api.reply(previewPostUpdateFixture.ok());
    const view = render();
    press("More actions");
    fireEvent.click(await view.findByRole("menuitem", { name: "Send update" }));
    expect(
      await view.findByRole("dialog", { name: "Send an update" }),
    ).toBeVisible();
    view.unmount();
    const limited = render({
      ...postTeam,
      permissions: { ...postTeam.permissions, manageSettings: false },
    });
    press("More actions");
    await limited.findByRole("menuitem", { name: "Copy link" });
    expect(limited.queryByRole("menuitem", { name: "Send update" })).toBeNull();
  });

  it("has no Delete without the delete permission", async () => {
    const view = render({
      ...postTeam,
      permissions: { ...postTeam.permissions, delete: false },
    });
    press("More actions");
    await view.findByRole("menuitem", { name: "Copy link" });
    expect(view.queryByRole("menuitem", { name: "Delete" })).toBeNull();
  });
});
