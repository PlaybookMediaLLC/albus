import { RefreshCw, Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { GetEmailChannelConfigResponse } from "../../../api/team/get-email-channel-config";
import { useDeleteSendingDomain } from "../../../hooks/team/use-delete-sending-domain";
import { useRestartSendingDomainChecks } from "../../../hooks/team/use-restart-sending-domain-checks";
import { useTeamRuntime } from "../../../team/runtime";
import { CopyField } from "../../../ui/copy-field";
import {
  RowActionsMenu,
  SettingsRow,
  StatusBadge,
  toast,
  type StatusTone,
} from "../../../ui/upstream";

export interface DomainRowsProps {
  workspaceId: string;
  domain: GetEmailChannelConfigResponse["domains"][number];
}

const tones: Record<string, StatusTone> = {
  verified: "success",
  pending: "warning",
  failed: "destructive",
};
const statusKeys: Record<string, string> = {
  verified: "settings-conversations.email.verified",
  pending: "settings-conversations.email.pending",
  failed: "settings-conversations.email.failedCheck",
};

/** A sending domain, its check state and, until it is verified, the DNS records to add. */
export function DomainRows({ workspaceId, domain }: DomainRowsProps) {
  const { t } = useTranslation("quills");
  const team = useTeamRuntime();
  const restart = useRestartSendingDomainChecks(team.viewer);
  const remove = useDeleteSendingDomain(team.viewer);
  const param = { workspaceId, sendingDomainId: domain.id };
  const failed = (key: string) => () => toast.error(t(key));
  return (
    <>
      <SettingsRow
        title={<span className="font-mono">{domain.domain}</span>}
        badge={
          <StatusBadge tone={tones[domain.status] ?? "neutral"}>
            {t(statusKeys[domain.status] ?? domain.status)}
          </StatusBadge>
        }
      >
        {team.permissions.manageSettings ? (
          <RowActionsMenu
            label={t("settings-conversations.email.actions", {
              name: domain.domain,
            })}
            actions={[
              {
                id: "check",
                label: t("settings-conversations.email.check"),
                icon: RefreshCw,
                onSelect: () =>
                  restart.mutate(
                    { param },
                    { onError: failed("settings-conversations.email.failed") },
                  ),
              },
              {
                id: "remove",
                label: t("settings-conversations.email.removeDomain"),
                icon: Trash2,
                destructive: true,
                // The API refuses a domain that a sending address still uses.
                onSelect: () =>
                  remove.mutate(
                    { param },
                    {
                      onError: failed(
                        "settings-conversations.email.domainInUse",
                      ),
                    },
                  ),
              },
            ]}
          />
        ) : null}
      </SettingsRow>
      {domain.status === "verified"
        ? null
        : domain.dnsRecords.map((record) => (
            <SettingsRow
              key={`${record.type}:${record.host}:${record.value}`}
              className="ps-8"
              title={
                <span className="font-mono text-xs">
                  {record.type} {record.host}
                </span>
              }
              description={record.purpose}
            >
              <CopyField
                label={t("settings-conversations.email.recordValue", {
                  type: record.type,
                })}
                value={record.value}
              />
            </SettingsRow>
          ))}
    </>
  );
}
