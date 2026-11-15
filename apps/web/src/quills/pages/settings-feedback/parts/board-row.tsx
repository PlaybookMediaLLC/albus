import { useNavigate } from "@tanstack/react-router";
import { Pencil, Settings2, Trash2 } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import type { ListBoardsResponse } from "../../../api/team/list-boards";
import { problemOf } from "../../../core/problem-of";
import { useDeleteBoard } from "../../../hooks/team/use-delete-board";
import { useUpdateBoard } from "../../../hooks/team/use-update-board";
import { useTeamRuntime } from "../../../team/runtime";
import { NameDialog } from "../../../ui/name-dialog";
import { SettingSelect } from "../../../ui/setting-select";
import {
  ConfirmDialog,
  RowActionsMenu,
  SettingsRow,
  toast,
} from "../../../ui/upstream";
import { withView, type AccessTier } from "../with-view";

export interface BoardRowProps {
  workspaceId: string;
  board: ListBoardsResponse["items"][number];
}

const tierKeys: Record<AccessTier, string> = {
  anonymous: "settings-product.boards.tiers.anonymous",
  authenticated: "settings-product.boards.tiers.authenticated",
  segments: "settings-product.boards.tiers.segments",
  team: "settings-product.boards.tiers.team",
};

/** One board: its name, who can see it, and the rename, settings and delete actions. */
export function BoardRow({ workspaceId, board }: BoardRowProps) {
  const { t } = useTranslation("quills");
  const team = useTeamRuntime();
  const navigate = useNavigate();
  const update = useUpdateBoard(team.viewer);
  const remove = useDeleteBoard(team.viewer);
  const [renaming, setRenaming] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const manage = team.permissions.manageSettings;
  const param = { workspaceId, boardId: board.id };
  const view = board.access.view;
  const tiers: AccessTier[] =
    view === "segments" ? ["segments"] : ["anonymous", "authenticated", "team"];
  return (
    <SettingsRow title={<span className="font-normal">{board.name}</span>}>
      <SettingSelect
        label={t("settings-product.boards.visibilityOf", { name: board.name })}
        value={view}
        options={tiers.map((tier) => ({
          value: tier,
          label: t(tierKeys[tier]),
        }))}
        // A segment list is chosen on the board settings page.
        disabled={!manage || view === "segments"}
        className="rounded-full border-transparent bg-muted"
        onValueChange={async (next) => {
          await update.mutateAsync({
            param,
            json: { access: withView(board.access, next) },
          });
        }}
      />
      {manage ? (
        <RowActionsMenu
          label={t("settings-product.boards.actions", { name: board.name })}
          actions={[
            {
              id: "rename",
              label: t("settings-product.boards.rename"),
              icon: Pencil,
              onSelect: () => setRenaming(true),
            },
            {
              id: "settings",
              label: t("settings-product.boards.settings"),
              icon: Settings2,
              onSelect: () =>
                void navigate({
                  to: "/feedback/$workspaceId/settings/boards",
                  params: { workspaceId },
                }),
            },
            {
              id: "delete",
              label: t("settings-product.boards.delete"),
              icon: Trash2,
              destructive: true,
              onSelect: () => setDeleting(true),
            },
          ]}
        />
      ) : null}
      <NameDialog
        key={String(renaming)}
        open={renaming}
        onOpenChange={setRenaming}
        title={t("settings-product.boards.rename")}
        description={t("settings-product.boards.renameText")}
        label={t("settings-product.boards.name")}
        maxLength={100}
        defaultValue={board.name}
        submitKey="settings-product.dialog.save"
        onSubmit={async (name) => {
          const problem = await problemOf(
            update.mutateAsync({ param, json: { name } }),
          );
          if (!problem) setRenaming(false);
          return problem;
        }}
      />
      <ConfirmDialog
        open={deleting}
        onOpenChange={setDeleting}
        title={t("settings-product.boards.deleteTitle", { name: board.name })}
        description={t("settings-product.boards.deleteText")}
        confirmLabel={t("settings-product.boards.delete")}
        pending={remove.isPending}
        onConfirm={() =>
          remove.mutate(
            { param },
            {
              onSuccess: () => setDeleting(false),
              onError: () =>
                toast.error(t("settings-product.boards.deleteFailed")),
            },
          )
        }
      />
    </SettingsRow>
  );
}
