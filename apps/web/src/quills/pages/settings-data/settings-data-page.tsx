import { useTranslation } from "react-i18next";
import { useListExportRuns } from "../../hooks/team/use-list-export-runs";
import { useListImportRuns } from "../../hooks/team/use-list-import-runs";
import { useListSettings } from "../../hooks/team/use-list-settings";
import { useTeamRuntime } from "../../team/runtime";
import { TeamStateView } from "../../team/team-state-view";
import { PageFrame } from "../../ui/page-frame";
import { SettingsCard, SettingsPage, SettingsSection } from "../../ui/upstream";
import { CompanyImportSheet } from "./parts/company-import-sheet";
import { DeleteWorkspaceRow } from "./parts/delete-workspace-row";
import { DownloadButton } from "./parts/download-button";
import { ExportDialog } from "./parts/export-dialog";
import { ImportSheet } from "./parts/import-sheet";
import { RunRow } from "./parts/run-row";
import { WipeDataRow } from "./parts/wipe-data-row";

export interface SettingsDataPageProps {
  workspaceId: string;
  params: Record<string, string>;
  search: Record<string, unknown>;
}

const recent = { limit: "5" };

/** Settings › Data & Import (settings spec B10): CSV import and export, and the data wipe. */
export function SettingsDataPage({ workspaceId }: SettingsDataPageProps) {
  const { t } = useTranslation("quills");
  const team = useTeamRuntime();
  const param = { workspaceId };
  const imports = useListImportRuns({ param, query: recent }, team.viewer);
  const exports = useListExportRuns({ param, query: recent }, team.viewer);
  const settings = useListSettings({ param }, team.viewer);
  return (
    <PageFrame
      titleKey="settings-connections.data.title"
      variant="app"
      landmark={false}
    >
      <SettingsPage
        title={t("settings-connections.data.title")}
        description={t("settings-connections.data.description")}
      >
        <TeamStateView
          loading={imports.isPending || exports.isPending || settings.isPending}
          problem={imports.error ?? exports.error ?? settings.error}
        >
          <SettingsSection title={t("settings-connections.data.import")}>
            <SettingsCard>
              <ImportSheet workspaceId={workspaceId} />
              {team.permissions.manageSettings ? (
                <CompanyImportSheet workspaceId={workspaceId} />
              ) : null}
              {imports.data?.items.map((run) => (
                <RunRow
                  key={run.id}
                  name={run.fileName}
                  status={run.status}
                  detail={
                    run.totals
                      ? t("settings-connections.data.totals", run.totals)
                      : undefined
                  }
                  // ponytail: the first 10 row errors; page them if people need the full report.
                  problems={run.errorReport
                    ?.slice(0, 10)
                    .map((error) =>
                      t("settings-connections.data.rowError", error),
                    )}
                />
              ))}
            </SettingsCard>
          </SettingsSection>
          <SettingsSection title={t("settings-connections.data.export")}>
            <SettingsCard>
              <ExportDialog workspaceId={workspaceId} />
              {exports.data?.items.map((run) => {
                // ponytail: checked at render; a page left open past the time gets the API error.
                const expired =
                  run.expiresAt !== null &&
                  Date.parse(run.expiresAt) <= Date.now();
                const ready = run.status === "completed";
                return (
                  <RunRow
                    key={run.id}
                    name={run.fileName}
                    status={run.status}
                    detail={
                      ready && expired
                        ? t("settings-connections.data.expired")
                        : undefined
                    }
                    problems={run.error ? [run.error] : undefined}
                  >
                    {ready && !expired ? (
                      <DownloadButton
                        workspaceId={workspaceId}
                        runId={run.id}
                      />
                    ) : null}
                  </RunRow>
                );
              })}
            </SettingsCard>
          </SettingsSection>
          <SettingsSection title={t("settings-connections.data.danger")}>
            <SettingsCard tone="danger">
              <WipeDataRow
                workspaceId={workspaceId}
                slug={settings.data?.slug ?? ""}
              />
              <DeleteWorkspaceRow workspaceId={workspaceId} />
            </SettingsCard>
          </SettingsSection>
        </TeamStateView>
      </SettingsPage>
    </PageFrame>
  );
}
