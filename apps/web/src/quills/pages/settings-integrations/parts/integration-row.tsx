import { Unplug } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { avatarTone } from "../../../core/avatar-tone";
import { brandMarks } from "../../../ui/brand-marks";
import { BrandIcon } from "../../../ui/brand-icon";
import { useDeleteIntegration } from "../../../hooks/team/use-delete-integration";
import { useTeamRuntime } from "../../../team/runtime";
import {
  ConfirmDialog,
  RowActionsMenu,
  SettingsRow,
  StatusBadge,
  toast,
} from "../../../ui/upstream";
import { connectors } from "../connectors";
import { ConnectAction } from "./connect-action";

export interface IntegrationRowProps {
  workspaceId: string;
  provider: { id: string; name: string; description: string };
  /** The workspace connection of this provider, if one exists. */
  connection?: { id: string; status: string } | null;
  onConnected: () => void;
}

/** One provider: Connect, or the connection state with Disconnect behind a confirmation. */
export function IntegrationRow({
  workspaceId,
  provider,
  connection,
  onConnected,
}: IntegrationRowProps) {
  const { t } = useTranslation("quills");
  const team = useTeamRuntime();
  const remove = useDeleteIntegration(team.viewer);
  const [confirming, setConfirming] = useState(false);
  const manage = team.permissions.manageSettings;
  const connector = connectors[provider.id];
  const active = connection?.status === "active";
  return (
    <SettingsRow
      icon={
        brandMarks[provider.id] ? (
          <BrandIcon id={provider.id} />
        ) : (
          <span className="text-sm font-semibold">
            {provider.name.charAt(0).toUpperCase()}
          </span>
        )
      }
      iconClassName={
        brandMarks[provider.id]
          ? "text-foreground"
          : `border-transparent ${avatarTone(provider.name)}`
      }
      title={provider.name}
      description={provider.description}
    >
      {connection ? (
        <>
          <StatusBadge tone={active ? "success" : "neutral"}>
            {t(
              active
                ? "settings-connections.integrations.connected"
                : "settings-connections.integrations.inactive",
            )}
          </StatusBadge>
          {manage ? (
            <RowActionsMenu
              label={t("settings-connections.integrations.actions", {
                name: provider.name,
              })}
              actions={[
                {
                  id: "disconnect",
                  label: t("settings-connections.integrations.disconnect"),
                  icon: Unplug,
                  destructive: true,
                  onSelect: () => setConfirming(true),
                },
              ]}
            />
          ) : null}
          <ConfirmDialog
            open={confirming}
            onOpenChange={setConfirming}
            title={t("settings-connections.integrations.disconnectTitle", {
              name: provider.name,
            })}
            description={t("settings-connections.integrations.disconnectText")}
            confirmLabel={t("settings-connections.integrations.disconnect")}
            pending={remove.isPending}
            onConfirm={() =>
              remove.mutate(
                { param: { workspaceId, integrationId: connection.id } },
                {
                  onSuccess: () => setConfirming(false),
                  onError: () =>
                    toast.error(
                      t("settings-connections.integrations.disconnectFailed"),
                    ),
                },
              )
            }
          />
        </>
      ) : manage && connector ? (
        <ConnectAction
          workspaceId={workspaceId}
          name={provider.name}
          connector={connector}
          onConnected={onConnected}
        />
      ) : null}
    </SettingsRow>
  );
}
