import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useDeleteChangelogEntry } from "../../../hooks/team/use-delete-changelog-entry";
import { useTeamRuntime } from "../../../team/runtime";
import { Button, ConfirmDialog, toast } from "../../../ui/upstream";

export interface DeleteEntryProps {
  workspaceId: string;
  entryId: string;
  onDeleted: () => void;
}

/** The red "Delete entry" link of the publish popover, with its confirmation. */
export function DeleteEntry({
  workspaceId,
  entryId,
  onDeleted,
}: DeleteEntryProps) {
  const { t } = useTranslation("quills");
  const team = useTeamRuntime();
  const remove = useDeleteChangelogEntry(team.viewer);
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button
        variant="link"
        size="sm"
        className="text-destructive-foreground"
        disabled={!team.permissions.delete}
        onClick={() => setOpen(true)}
      >
        {t("team-changelog.editor.delete")}
      </Button>
      <ConfirmDialog
        open={open}
        onOpenChange={setOpen}
        title={t("team-changelog.editor.deleteTitle")}
        description={t("team-changelog.editor.deleteText")}
        confirmLabel={t("team-changelog.editor.delete")}
        pending={remove.isPending}
        onConfirm={() =>
          void remove
            .mutateAsync({ param: { workspaceId, entryId } })
            .then(() => {
              setOpen(false);
              onDeleted();
            })
            .catch(() => toast.error(t("team-changelog.editor.failed")))
        }
      />
    </>
  );
}
