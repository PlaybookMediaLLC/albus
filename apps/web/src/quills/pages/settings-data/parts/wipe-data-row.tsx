import { useId, useState } from "react";
import { useTranslation } from "react-i18next";
import { useWipeWorkspaceData } from "../../../hooks/team/use-wipe-workspace-data";
import {
  Button,
  ConfirmDialog,
  Input,
  Label,
  SettingsRow,
  toast,
} from "../../../ui/upstream";

export interface WipeDataRowProps {
  workspaceId: string;
  /** The workspace slug. The person types it to confirm, and the API checks it again. */
  slug: string;
}

/** The danger zone row that deletes all feedback and support data of the workspace. */
export function WipeDataRow({ workspaceId, slug }: WipeDataRowProps) {
  const { t } = useTranslation("quills");
  const id = useId();
  const wipe = useWipeWorkspaceData();
  const [open, setOpen] = useState(false);
  const [typed, setTyped] = useState("");
  const close = (next: boolean) => {
    setOpen(next);
    if (!next) setTyped("");
  };
  return (
    <SettingsRow
      title={t("settings-connections.data.wipe")}
      titleClassName="text-destructive-foreground"
      description={t("settings-connections.data.wipeText")}
    >
      <Button
        variant="destructive-outline"
        size="sm"
        onClick={() => setOpen(true)}
      >
        {t("settings-connections.data.wipeAction")}
      </Button>
      <ConfirmDialog
        open={open}
        onOpenChange={close}
        title={t("settings-connections.data.wipeTitle")}
        description={t("settings-connections.data.wipeList")}
        confirmLabel={t("settings-connections.data.wipeAction")}
        pending={wipe.isPending}
        confirmDisabled={!slug || typed !== slug}
        onConfirm={() =>
          wipe.mutate(
            { param: { workspaceId }, json: { confirm: typed } },
            {
              onSuccess: () => {
                close(false);
                toast.success(t("settings-connections.data.wipeStarted"));
              },
              onError: () => toast.error(t("core.problem.failed")),
            },
          )
        }
      >
        <div className="grid gap-2">
          <Label htmlFor={id}>
            {t("settings-connections.data.wipeConfirm", { slug })}
          </Label>
          <Input
            id={id}
            autoComplete="off"
            value={typed}
            onChange={(event) => setTyped(event.target.value)}
          />
        </div>
      </ConfirmDialog>
    </SettingsRow>
  );
}
