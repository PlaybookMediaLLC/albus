import { fireEvent } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vite-plus/test";
import { describePageContract } from "../../test/contracts";
import { mockApi } from "../../test/mock-api";
import { renderPage } from "../../test/render";
import { meta } from "./meta";
import { SettingsTeamPage } from "./settings-team-page";

const state = vi.hoisted(() => ({
  workspace: {
    data: undefined as
      | { members: unknown[]; invitations: unknown[] }
      | undefined,
    isPending: false,
    isError: false,
  },
  canInvite: true,
}));
// Kaneo's own table, invite dialog and workspace hooks have their own tests.
vi.mock("@/hooks/queries/workspace/use-get-full-workspace", () => ({
  default: () => state.workspace,
}));
vi.mock("@/hooks/use-workspace-permission", () => ({
  useWorkspacePermission: () => ({ canInviteUsers: () => state.canInvite }),
}));
vi.mock("@/components/team/members-table", () => ({
  default: ({ users }: { users: unknown[] }) => <p>{users.length} members</p>,
}));
vi.mock("@/components/team/invite-team-member-modal", () => ({
  default: ({ open }: { open: boolean }) =>
    open ? <div role="dialog" aria-label="Invite dialog" /> : null,
}));

describe("SettingsTeamPage", () => {
  beforeEach(() => {
    state.workspace = {
      data: { members: [{}, {}], invitations: [] },
      isPending: false,
      isError: false,
    };
    state.canInvite = true;
  });

  describePageContract(meta, SettingsTeamPage, {
    ready: {
      prepare: () => {
        mockApi();
      },
    },
  });

  it("shows Kaneo's members table and opens the invite dialog", () => {
    const view = renderPage(SettingsTeamPage, meta);
    expect(view.getByText("2 members")).toBeInTheDocument();
    fireEvent.click(view.getByRole("button", { name: "Invite member" }));
    expect(
      view.getByRole("dialog", { name: "Invite dialog" }),
    ).toBeInTheDocument();
  });

  it("hides the invite button without the Kaneo capability", () => {
    state.canInvite = false;
    const view = renderPage(SettingsTeamPage, meta);
    expect(view.queryByRole("button", { name: "Invite member" })).toBeNull();
  });

  it("shows the loading and the failed state of the members", () => {
    state.workspace = { data: undefined, isPending: true, isError: false };
    const loading = renderPage(SettingsTeamPage, meta);
    expect(loading.getAllByRole("status")[0]).toHaveTextContent(/loading/i);
    loading.unmount();
    state.workspace = { data: undefined, isPending: false, isError: true };
    const failed = renderPage(SettingsTeamPage, meta);
    expect(failed.getByRole("alert")).toBeInTheDocument();
  });
});
