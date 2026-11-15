import { Ban, Ellipsis, UserMinus } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import type { PortalProblem } from "../../../core/types";
import { useBlockUser } from "../../../hooks/team/use-block-user";
import { useDeleteUser } from "../../../hooks/team/use-delete-user";
import { useUnblockUser } from "../../../hooks/team/use-unblock-user";
import { useTeamRuntime } from "../../../team/runtime";
import { IconButton } from "../../../ui/inbox/icon-button";
import {
  ConfirmDialog,
  Menu,
  MenuItem,
  MenuPopup,
  MenuSeparator,
  MenuTrigger,
  toast,
} from "../../../ui/upstream";

export interface MemberMenuProps {
  workspaceId: string;
  member: { principalId: string; name: string; blockedAt: string | null };
  onRemoved: () => void;
}

/** The kebab menu of a member: block or unblock, and remove after a confirmation. */
export function MemberMenu({
  workspaceId,
  member,
  onRemoved,
}: MemberMenuProps) {
  const { t } = useTranslation("quills");
  const team = useTeamRuntime();
  const block = useBlockUser(team.viewer);
  const unblock = useUnblockUser(team.viewer);
  const remove = useDeleteUser(team.viewer);
  const [confirm, setConfirm] = useState(false);
  const input = {
    param: { workspaceId, principalId: member.principalId },
  };
  // A 409 means that the person still authors posts, comments or conversations.
  const fail = (problem: PortalProblem) =>
    toast.error(
      t(
        problem.kind === "conflict"
          ? "team-members.removeConflict"
          : "team-members.failed",
      ),
    );
  const toggleBlock = () =>
    (member.blockedAt ? unblock : block)
      .mutateAsync(input)
      .then(() =>
        toast.success(
          t(
            member.blockedAt
              ? "team-members.unblocked"
              : "team-members.blockedDone",
          ),
        ),
      )
      .catch(fail);
  return (
    <>
      <Menu>
        <MenuTrigger render={<IconButton label={t("team-members.actions")} />}>
          <Ellipsis aria-hidden="true" />
        </MenuTrigger>
        <MenuPopup align="end">
          <MenuItem
            disabled={!team.permissions.update}
            onClick={() => void toggleBlock()}
          >
            <Ban aria-hidden="true" />
            {t(
              member.blockedAt ? "team-members.unblock" : "team-members.block",
            )}
          </MenuItem>
          <MenuSeparator />
          <MenuItem
            variant="destructive"
            disabled={!team.permissions.delete}
            onClick={() => setConfirm(true)}
          >
            <UserMinus aria-hidden="true" />
            {t("team-members.remove")}
          </MenuItem>
        </MenuPopup>
      </Menu>
      <ConfirmDialog
        open={confirm}
        onOpenChange={setConfirm}
        title={t("team-members.removeTitle", { name: member.name })}
        description={t("team-members.removeText")}
        confirmLabel={t("team-members.remove")}
        pending={remove.isPending}
        onConfirm={() =>
          void remove
            .mutateAsync(input)
            .then(() => {
              setConfirm(false);
              toast.success(t("team-members.removed"));
              onRemoved();
            })
            .catch(fail)
        }
      />
    </>
  );
}
