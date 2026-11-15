import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useRotateWidgetSecret } from "../../../hooks/team/use-rotate-widget-secret";
import { useTeamRuntime } from "../../../team/runtime";
import { CopyField } from "../../../ui/copy-field";
import {
  Button,
  ConfirmDialog,
  SettingsRow,
  toast,
} from "../../../ui/upstream";

export interface WidgetSecretRowsProps {
  workspaceId: string;
  /** Null until the first secret is created. */
  secret: string | null;
}

/** The widget signing secret: create it, copy it, or rotate it after a confirmation. */
export function WidgetSecretRows({
  workspaceId,
  secret,
}: WidgetSecretRowsProps) {
  const { t } = useTranslation("quills");
  const team = useTeamRuntime();
  const rotate = useRotateWidgetSecret(team.viewer);
  const [confirming, setConfirming] = useState(false);
  // The secret that this page just made. It shows in full once, so it can be copied.
  const [fresh, setFresh] = useState<string | null>(null);
  const run = async () => {
    try {
      const result = await rotate.mutateAsync({ param: { workspaceId } });
      setFresh(result.secret);
      setConfirming(false);
      toast.success(t("settings-product.login.created"));
    } catch {
      toast.error(t("settings-product.login.rotateFailed"));
    }
  };
  const label = t("settings-product.login.secret");
  return (
    <>
      <SettingsRow
        title={label}
        description={t("settings-product.login.secretText")}
      >
        {secret ? (
          <CopyField label={label} value={fresh ?? secret} masked={!fresh} />
        ) : (
          <Button
            size="sm"
            loading={rotate.isPending}
            onClick={() => void run()}
          >
            {t("settings-product.login.create")}
          </Button>
        )}
      </SettingsRow>
      {secret ? (
        <SettingsRow
          title={t("settings-product.login.rotate")}
          titleClassName="text-destructive-foreground"
          description={t("settings-product.login.rotateText")}
        >
          <Button
            variant="outline"
            size="sm"
            onClick={() => setConfirming(true)}
          >
            {t("settings-product.login.rotateAction")}
          </Button>
        </SettingsRow>
      ) : null}
      <ConfirmDialog
        open={confirming}
        onOpenChange={setConfirming}
        title={t("settings-product.login.rotateTitle")}
        description={t("settings-product.login.rotateText")}
        confirmLabel={t("settings-product.login.rotateAction")}
        pending={rotate.isPending}
        onConfirm={() => void run()}
      />
    </>
  );
}
