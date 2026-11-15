import { useTranslation } from "react-i18next";
import { useMintWidgetInstallCode } from "../../../hooks/team/use-mint-widget-install-code";
import { ConfirmAction } from "../../../ui/confirm-action";
import { CopyField } from "../../../ui/copy-field";

export interface InstallCodeProps {
  workspaceId: string;
}

/**
 * "Create install code": a short code for the widget setup. The API says that it expires
 * after 15 minutes and works twice.
 */
export function InstallCode({ workspaceId }: InstallCodeProps) {
  const { t, i18n } = useTranslation("quills");
  const mint = useMintWidgetInstallCode();
  return (
    <div className="grid gap-2">
      <ConfirmAction
        labelKey="team-share.widget.installCode"
        onConfirm={async () => {
          await mint.mutateAsync({ param: { workspaceId } });
        }}
      />
      {mint.data ? (
        <div className="grid gap-1">
          <CopyField
            value={mint.data.code}
            label={t("team-share.widget.code")}
          />
          <p className="text-xs text-muted-foreground">
            {t("team-share.widget.expires", {
              time: new Date(mint.data.expiresAt).toLocaleTimeString(
                i18n.language,
                {
                  hour: "numeric",
                  minute: "2-digit",
                },
              ),
            })}
          </p>
        </div>
      ) : null}
    </div>
  );
}
