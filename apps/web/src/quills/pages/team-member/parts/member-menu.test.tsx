import { fireEvent, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vite-plus/test";
import { deleteUserFixture } from "../../../api/team/delete-user.fixture";
import { unblockUserFixture } from "../../../api/team/unblock-user.fixture";
import { mockApi } from "../../../test/mock-api";
import { renderComponent } from "../../../test/render";
import { inTeam } from "../member.fixture";
import { MemberMenu } from "./member-menu";

const blocked = {
  principalId: "principal_1",
  name: "Ada",
  blockedAt: "2026-01-01T00:00:00.000Z",
};

describe("MemberMenu", () => {
  it("unblocks a blocked member", async () => {
    const api = mockApi();
    const Menu = () => (
      <MemberMenu
        workspaceId="workspace_test_1"
        member={blocked}
        onRemoved={() => undefined}
      />
    );
    const view = renderComponent(inTeam(<Menu />));
    api.reply(unblockUserFixture.ok());
    fireEvent.click(view.getByRole("button", { name: "Member actions" }));
    fireEvent.click(await view.findByRole("menuitem", { name: "Unblock" }));
    await waitFor(() => expect(api.calls("unblockQuillsUser")).toHaveLength(1));
  });

  it("removes after the confirmation and calls back", async () => {
    const api = mockApi();
    const onRemoved = vi.fn();
    const Menu = () => (
      <MemberMenu
        workspaceId="workspace_test_1"
        member={blocked}
        onRemoved={onRemoved}
      />
    );
    const view = renderComponent(inTeam(<Menu />));
    api.reply(deleteUserFixture.ok());
    fireEvent.click(view.getByRole("button", { name: "Member actions" }));
    fireEvent.click(
      await view.findByRole("menuitem", { name: "Remove member" }),
    );
    expect(await view.findByRole("alertdialog")).toHaveTextContent(
      "Remove Ada?",
    );
    expect(api.calls()).toHaveLength(0);
    fireEvent.click(
      view.getAllByRole("button", { name: "Remove member" }).at(-1)!,
    );
    await waitFor(() => expect(onRemoved).toHaveBeenCalledTimes(1));
    expect(new URL(api.calls("deleteQuillsUser")[0]!.url).pathname).toBe(
      "/api/quills/workspace_test_1/users/principal_1",
    );
  });

  it("disables the actions without their permissions", async () => {
    const Menu = () => (
      <MemberMenu
        workspaceId="workspace_test_1"
        member={blocked}
        onRemoved={() => undefined}
      />
    );
    const view = renderComponent(
      inTeam(<Menu />, { update: false, delete: false }),
    );
    fireEvent.click(view.getByRole("button", { name: "Member actions" }));
    expect(
      await view.findByRole("menuitem", { name: "Unblock" }),
    ).toHaveAttribute("aria-disabled", "true");
    expect(
      view.getByRole("menuitem", { name: "Remove member" }),
    ).toHaveAttribute("aria-disabled", "true");
  });
});
