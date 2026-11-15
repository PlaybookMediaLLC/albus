import { Globe, Inbox } from "lucide-react";
import { useTranslation } from "react-i18next";
import { shortDate } from "../../core/short-date";
import { useGetEmailChannelConfig } from "../../hooks/team/use-get-email-channel-config";
import { useGetEmailChannelStatus } from "../../hooks/team/use-get-email-channel-status";
import { useListRecentEmailLog } from "../../hooks/team/use-list-recent-email-log";
import { useTeamRuntime } from "../../team/runtime";
import { TeamStateView } from "../../team/team-state-view";
import { PageFrame } from "../../ui/page-frame";
import {
  SettingsCard,
  SettingsEmpty,
  SettingsPage,
  SettingsRow,
  SettingsSection,
  StatusBadge,
} from "../../ui/upstream";
import { DomainRows } from "./parts/domain-rows";
import { InboundSection } from "./parts/inbound-section";
import { SendingSection } from "./parts/sending-section";

export interface SettingsConversationsEmailPageProps {
  workspaceId: string;
  params: Record<string, string>;
  search: Record<string, unknown>;
}

/** Settings › Email (settings spec B12): the email channel, its addresses, domains and log. */
export function SettingsConversationsEmailPage({
  workspaceId,
}: SettingsConversationsEmailPageProps) {
  const { t, i18n } = useTranslation("quills");
  const team = useTeamRuntime();
  const input = { param: { workspaceId } };
  const status = useGetEmailChannelStatus(input, team.viewer);
  const config = useGetEmailChannelConfig(input, team.viewer);
  const log = useListRecentEmailLog(input, team.viewer);
  const queries = [status, config, log];
  const domains = config.data?.domains ?? [];
  return (
    <PageFrame
      titleKey="settings-conversations.email.title"
      variant="app"
      landmark={false}
    >
      <SettingsPage
        title={t("settings-conversations.email.title")}
        description={t("settings-conversations.email.description")}
      >
        <TeamStateView
          loading={queries.some((query) => query.isPending)}
          problem={queries.find((query) => query.error)?.error}
        >
          <SettingsSection title={t("settings-conversations.email.channel")}>
            <SettingsCard>
              <SettingsRow
                title={t("settings-conversations.email.provider")}
                description={t("settings-conversations.email.providerText")}
              >
                <span className="text-sm text-muted-foreground">
                  {status.data?.provider ??
                    t("settings-conversations.email.none")}
                </span>
              </SettingsRow>
              <SettingsRow
                title={t("settings-conversations.email.from")}
                description={status.data?.fromAddress ?? undefined}
              >
                <StatusBadge
                  tone={status.data?.inboundConfigured ? "success" : "neutral"}
                >
                  {t(
                    status.data?.inboundConfigured
                      ? "settings-conversations.email.receiving"
                      : "settings-conversations.email.notReceiving",
                  )}
                </StatusBadge>
              </SettingsRow>
            </SettingsCard>
          </SettingsSection>
          <InboundSection
            workspaceId={workspaceId}
            route={config.data?.inboundRoute ?? null}
          />
          <SendingSection
            workspaceId={workspaceId}
            addresses={config.data?.sendingAddresses ?? []}
          />
          <SettingsSection title={t("settings-conversations.email.domains")}>
            <SettingsCard>
              {domains.length ? (
                domains.map((domain) => (
                  <DomainRows
                    key={domain.id}
                    workspaceId={workspaceId}
                    domain={domain}
                  />
                ))
              ) : (
                <SettingsEmpty
                  icon={<Globe />}
                  title={t("settings-conversations.email.noDomains")}
                  description={t("settings-conversations.email.noDomainsText")}
                />
              )}
            </SettingsCard>
          </SettingsSection>
          <SettingsSection title={t("settings-conversations.email.log")}>
            <SettingsCard>
              {log.data?.items.length ? (
                log.data.items.map((entry) => (
                  <SettingsRow
                    key={entry.id}
                    title={entry.subject ?? entry.address}
                    description={`${entry.address} · ${shortDate(entry.createdAt, i18n.language)}`}
                    badge={
                      <StatusBadge tone="neutral">{entry.status}</StatusBadge>
                    }
                  />
                ))
              ) : (
                <SettingsEmpty
                  icon={<Inbox />}
                  title={t("settings-conversations.email.noLog")}
                  description={t("settings-conversations.email.noLogText")}
                />
              )}
            </SettingsCard>
          </SettingsSection>
        </TeamStateView>
      </SettingsPage>
    </PageFrame>
  );
}
