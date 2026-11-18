import { useTranslation } from "react-i18next";
import { navEnabled, withNavItem } from "../../core/portal-nav";
import { useGetPortalSettings } from "../../hooks/team/use-get-portal-settings";
import { useGetScoringFactors } from "../../hooks/team/use-get-scoring-factors";
import { useListBoards } from "../../hooks/team/use-list-boards";
import { useListTags } from "../../hooks/team/use-list-tags";
import { useUpdatePortalSettings } from "../../hooks/team/use-update-portal-settings";
import { useTeamRuntime } from "../../team/runtime";
import { TeamStateView } from "../../team/team-state-view";
import { PageFrame } from "../../ui/page-frame";
import { SettingSwitchRow } from "../../ui/setting-switch-row";
import { SettingsCard, SettingsPage, SettingsSection } from "../../ui/upstream";
import { BoardsSection } from "./parts/boards-section";
import { ScoringSection } from "./parts/scoring-section";
import { TagsSection } from "./parts/tags-section";

export interface SettingsFeedbackPageProps {
  workspaceId: string;
  params: Record<string, string>;
  search: Record<string, unknown>;
}

// ponytail: the first 100 boards and tags (the API maximum); page them when a workspace has more.
const first = { offset: "0", limit: "100" };

/**
 * Settings › Feedback (settings spec B5): the public board switch, the public roadmap tab, the boards, the post tags and the
 * team's scoring factors (#79).
 */
export function SettingsFeedbackPage({
  workspaceId,
}: SettingsFeedbackPageProps) {
  const { t } = useTranslation("quills");
  const team = useTeamRuntime();
  const param = { workspaceId };
  const portal = useGetPortalSettings({ param }, team.viewer);
  const boards = useListBoards(
    { param, query: { counts: "false", ...first } },
    team.viewer,
  );
  const tags = useListTags({ param, query: first }, team.viewer);
  const factors = useGetScoringFactors({ param }, team.viewer);
  const update = useUpdatePortalSettings(team.viewer);
  const nav = portal.data?.nav ?? [];
  return (
    <PageFrame
      titleKey="settings-product.feedback.title"
      variant="app"
      landmark={false}
    >
      <SettingsPage
        title={t("settings-product.feedback.title")}
        description={t("settings-product.feedback.description")}
      >
        <TeamStateView
          loading={
            portal.isPending ||
            boards.isPending ||
            tags.isPending ||
            factors.isPending
          }
          problem={portal.error ?? boards.error ?? tags.error ?? factors.error}
        >
          <SettingsSection title={t("settings-product.behavior")}>
            <SettingsCard>
              <SettingSwitchRow
                title={t("settings-product.feedback.portal")}
                description={t("settings-product.feedback.portalText")}
                checked={portal.data?.enabled ?? false}
                disabled={!team.permissions.manageSettings}
                onCheckedChange={async (next) => {
                  await update.mutateAsync({ param, json: { enabled: next } });
                }}
              />
              <SettingSwitchRow
                title={t("settings-product.feedback.roadmap")}
                description={t("settings-product.feedback.roadmapText")}
                checked={navEnabled(nav, "roadmap")}
                disabled={!team.permissions.manageSettings}
                onCheckedChange={async (next) => {
                  await update.mutateAsync({
                    param,
                    json: { nav: withNavItem(nav, "roadmap", next) },
                  });
                }}
              />
            </SettingsCard>
          </SettingsSection>
          <BoardsSection
            workspaceId={workspaceId}
            boards={boards.data?.items ?? []}
          />
          <TagsSection workspaceId={workspaceId} tags={tags.data?.tags ?? []} />
          <ScoringSection
            workspaceId={workspaceId}
            factors={factors.data?.factors ?? []}
          />
        </TeamStateView>
      </SettingsPage>
    </PageFrame>
  );
}
