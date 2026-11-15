import { Star, Trash2 } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import type { ListTeamsResponse } from "../../../api/team/list-teams";
import { useDeleteTeam } from "../../../hooks/team/use-delete-team";
import { useUpdateTeam } from "../../../hooks/team/use-update-team";
import { useUpdateTeamBinding } from "../../../hooks/team/use-update-team-binding";
import { useTeamRuntime } from "../../../team/runtime";
import { SettingSelect } from "../../../ui/setting-select";
import {
  ConfirmDialog,
  RowActionsMenu,
  SettingsRow,
  StatusBadge,
  toast,
} from "../../../ui/upstream";

export interface SupportTeamRowProps {
  workspaceId: string;
  team: ListTeamsResponse["teams"][number];
  /** The number of teammates in the team. */
  members: number;
}

type Method = "manual" | "round_robin" | "balanced";
const methods: readonly [Method, string][] = [
  ["manual", "settings-conversations.operators.methods.manual"],
  ["round_robin", "settings-conversations.operators.methods.round_robin"],
  ["balanced", "settings-conversations.operators.methods.balanced"],
];

/** One support team: its assignment method, "Make default" and delete. */
export function SupportTeamRow({
  workspaceId,
  team: supportTeam,
  members,
}: SupportTeamRowProps) {
  const { t } = useTranslation("quills");
  const team = useTeamRuntime();
  const update = useUpdateTeam(team.viewer);
  const bind = useUpdateTeamBinding(team.viewer);
  const remove = useDeleteTeam(team.viewer);
  const [deleting, setDeleting] = useState(false);
  const manage = team.permissions.manageSettings;
  const param = { workspaceId, teamId: supportTeam.id };
  const makeDefault = () =>
    bind
      .mutateAsync({
        param,
        json: { kaneoTeamId: supportTeam.kaneoTeamId, isDefault: true },
      })
      .catch(() =>
        toast.error(t("settings-conversations.operators.defaultFailed")),
      );
  return (
    <SettingsRow
      title={supportTeam.name}
      description={t("settings-conversations.operators.members", {
        count: members,
      })}
      badge={
        supportTeam.isDefault ? (
          <StatusBadge tone="neutral">
            {t("settings-conversations.operators.default")}
          </StatusBadge>
        ) : null
      }
    >
      <SettingSelect
        label={t("settings-conversations.operators.methodOf", {
          name: supportTeam.name,
        })}
        value={supportTeam.assignmentMethod as Method}
        options={methods.map(([value, key]) => ({ value, label: t(key) }))}
        disabled={!manage}
        onValueChange={async (assignmentMethod) => {
          await update.mutateAsync({ param, json: { assignmentMethod } });
        }}
      />
      {manage ? (
        <RowActionsMenu
          label={t("settings-conversations.operators.actions", {
            name: supportTeam.name,
          })}
          actions={[
            ...(supportTeam.isDefault
              ? []
              : [
                  {
                    id: "default",
                    label: t("settings-conversations.operators.makeDefault"),
                    icon: Star,
                    onSelect: () => void makeDefault(),
                  },
                ]),
            {
              id: "delete",
              label: t("settings-conversations.operators.delete"),
              icon: Trash2,
              destructive: true,
              onSelect: () => setDeleting(true),
            },
          ]}
        />
      ) : null}
      <ConfirmDialog
        open={deleting}
        onOpenChange={setDeleting}
        title={t("settings-conversations.operators.deleteTitle", {
          name: supportTeam.name,
        })}
        description={t("settings-conversations.operators.deleteText")}
        confirmLabel={t("settings-conversations.operators.delete")}
        pending={remove.isPending}
        onConfirm={() =>
          remove.mutate(
            { param },
            {
              onSuccess: () => setDeleting(false),
              onError: () =>
                toast.error(t("settings-conversations.operators.deleteFailed")),
            },
          )
        }
      />
    </SettingsRow>
  );
}
