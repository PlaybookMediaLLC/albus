import { useTranslation } from "react-i18next";
import { navEnabled, withNavItem } from "../../core/portal-nav";
import { problemOf } from "../../core/problem-of";
import { useCreateChangelogCategory } from "../../hooks/team/use-create-changelog-category";
import { useDeleteChangelogCategory } from "../../hooks/team/use-delete-changelog-category";
import { useGetChangelogSettings } from "../../hooks/team/use-get-changelog-settings";
import { useGetPortalSettings } from "../../hooks/team/use-get-portal-settings";
import { useListChangelogCategories } from "../../hooks/team/use-list-changelog-categories";
import { useUpdateChangelogCategory } from "../../hooks/team/use-update-changelog-category";
import { useUpdateChangelogSettings } from "../../hooks/team/use-update-changelog-settings";
import { useUpdatePortalSettings } from "../../hooks/team/use-update-portal-settings";
import { useTeamRuntime } from "../../team/runtime";
import { TeamStateView } from "../../team/team-state-view";
import { PageFrame } from "../../ui/page-frame";
import { SettingSwitchRow } from "../../ui/setting-switch-row";
import { TagList } from "../../ui/tag-list";
import { SettingsCard, SettingsPage, SettingsSection } from "../../ui/upstream";

export interface SettingsChangelogPageProps {
  workspaceId: string;
  params: Record<string, string>;
  search: Record<string, unknown>;
}

const copy = {
  title: "settings-product.categories.title",
  create: "settings-product.categories.new",
  createTitle: "settings-product.categories.createTitle",
  createText: "settings-product.categories.createText",
  rename: "settings-product.categories.rename",
  renameText: "settings-product.categories.renameText",
  name: "settings-product.categories.name",
  placeholder: "settings-product.categories.placeholder",
  taken: "settings-product.categories.taken",
  actions: "settings-product.categories.actions",
  delete: "settings-product.categories.delete",
  deleteTitle: "settings-product.categories.deleteTitle",
  deleteText: "settings-product.categories.deleteText",
  deleteFailed: "settings-product.categories.deleteFailed",
  emptyTitle: "settings-product.categories.emptyTitle",
  emptyText: "settings-product.categories.emptyText",
};

/** Settings › Changelog (settings spec B6): the public changelog tab, the widget's automatic open (#108) and the changelog tags. */
export function SettingsChangelogPage({
  workspaceId,
}: SettingsChangelogPageProps) {
  const { t } = useTranslation("quills");
  const team = useTeamRuntime();
  const param = { workspaceId };
  const portal = useGetPortalSettings({ param }, team.viewer);
  // ponytail: the first 100 tags (the API maximum); page them when a workspace has more.
  const categories = useListChangelogCategories(
    { param, query: { offset: "0", limit: "100" } },
    team.viewer,
  );
  const settings = useGetChangelogSettings({ param }, team.viewer);
  const update = useUpdatePortalSettings(team.viewer);
  const updateSettings = useUpdateChangelogSettings(team.viewer);
  const create = useCreateChangelogCategory(team.viewer);
  const rename = useUpdateChangelogCategory(team.viewer);
  const remove = useDeleteChangelogCategory(team.viewer);
  const manage = team.permissions.manageSettings;
  const nav = portal.data?.nav ?? [];
  const at = (categoryId: string) => ({ workspaceId, categoryId });
  return (
    <PageFrame
      titleKey="settings-product.changelog.title"
      variant="app"
      landmark={false}
    >
      <SettingsPage
        title={t("settings-product.changelog.title")}
        description={t("settings-product.changelog.description")}
      >
        <TeamStateView
          loading={
            portal.isPending || categories.isPending || settings.isPending
          }
          problem={portal.error ?? categories.error ?? settings.error}
        >
          <SettingsSection title={t("settings-product.behavior")}>
            <SettingsCard>
              <SettingSwitchRow
                title={t("settings-product.changelog.public")}
                description={t("settings-product.changelog.publicText")}
                checked={navEnabled(nav, "changelog")}
                disabled={!manage}
                onCheckedChange={async (next) => {
                  await update.mutateAsync({
                    param,
                    json: { nav: withNavItem(nav, "changelog", next) },
                  });
                }}
              />
              <SettingSwitchRow
                title={t("settings-product.changelog.autoOpen")}
                description={t("settings-product.changelog.autoOpenText")}
                checked={settings.data?.widgetAutoOpen ?? false}
                disabled={!manage}
                onCheckedChange={async (widgetAutoOpen) => {
                  await updateSettings.mutateAsync({
                    param,
                    json: { widgetAutoOpen },
                  });
                }}
              />
            </SettingsCard>
          </SettingsSection>
          <TagList
            items={categories.data?.categories ?? []}
            copy={copy}
            maxLength={50}
            canManage={manage}
            onCreate={(name) =>
              problemOf(create.mutateAsync({ param, json: { name } }))
            }
            onRename={(id, name) =>
              problemOf(rename.mutateAsync({ param: at(id), json: { name } }))
            }
            onDelete={async (id) => {
              await remove.mutateAsync({ param: at(id) });
            }}
          />
        </TeamStateView>
      </SettingsPage>
    </PageFrame>
  );
}
