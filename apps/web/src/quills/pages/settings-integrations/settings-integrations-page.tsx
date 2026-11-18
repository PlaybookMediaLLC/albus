import { useTranslation } from "react-i18next";
import { useListIntegrationCatalog } from "../../hooks/team/use-list-integration-catalog";
import { useListIntegrations } from "../../hooks/team/use-list-integrations";
import { useTeamRuntime } from "../../team/runtime";
import { TeamStateView } from "../../team/team-state-view";
import { PageFrame } from "../../ui/page-frame";
import { SettingsCard, SettingsPage } from "../../ui/upstream";
import { IntegrationRow } from "./parts/integration-row";
import { EmptyState } from "../../ui/empty-state";
import { IntegrationsArt } from "../../ui/illustrations/integrations-art";

export interface SettingsIntegrationsPageProps {
  workspaceId: string;
  params: Record<string, string>;
  search: Record<string, unknown>;
}

/**
 * Settings › Integrations (settings spec B9): each provider that this build can connect,
 * with Connect, or its connection with Disconnect.
 */
export function SettingsIntegrationsPage({
  workspaceId,
}: SettingsIntegrationsPageProps) {
  const { t } = useTranslation("quills");
  const team = useTeamRuntime();
  const param = { workspaceId };
  const catalog = useListIntegrationCatalog({ param }, team.viewer);
  const connections = useListIntegrations({ param }, team.viewer);
  const providers =
    catalog.data?.providers.filter((provider) => provider.available) ?? [];
  return (
    <PageFrame
      titleKey="settings-connections.integrations.title"
      variant="app"
      landmark={false}
    >
      <SettingsPage
        title={t("settings-connections.integrations.title")}
        description={t("settings-connections.integrations.description")}
      >
        <TeamStateView
          loading={catalog.isPending || connections.isPending}
          problem={catalog.error ?? connections.error}
          empty={!providers.length}
          emptyState={
            <EmptyState
              art={<IntegrationsArt />}
              title={t("empty.integrations.title")}
              description={t("empty.integrations.body")}
            />
          }
        >
          <SettingsCard>
            {providers.map((provider) => (
              <IntegrationRow
                key={provider.id}
                workspaceId={workspaceId}
                provider={provider}
                connection={connections.data?.integrations.find(
                  (connection) => connection?.integrationType === provider.id,
                )}
                onConnected={() => void connections.refetch()}
              />
            ))}
          </SettingsCard>
        </TeamStateView>
      </SettingsPage>
    </PageFrame>
  );
}
