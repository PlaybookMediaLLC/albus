import { brandText } from "@kaneo/branding";
import { Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, BookOpen } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useListSettings } from "../hooks/team/use-list-settings";
import { SearchField } from "../ui/inbox/search-field";
import { Button, useGetConfig } from "../ui/upstream";
import { filterSettingsNav } from "./filter-settings-nav";
import { useTeamRuntime } from "./runtime";
import { settingsSections } from "./settings-nav";
import { SidebarItem } from "./sidebar-item";
import { SidebarNav } from "./sidebar-nav";
import { teamHref } from "./team-href";

export interface SettingsSidebarProps {
  workspaceId: string;
  /** Runs after an item is chosen, for example to close the sheet on small screens. */
  onNavigate?: () => void;
}

/**
 * The sidebar of the settings area (settings spec 1.3): the title and Back, a search field,
 * the settings sections and Docs. The rail beside it has the workspace and the bell.
 */
export function SettingsSidebar({
  workspaceId,
  onNavigate,
}: SettingsSidebarProps) {
  const { t } = useTranslation("quills");
  const team = useTeamRuntime();
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const settings = useListSettings({ param: { workspaceId } }, team.viewer);
  const config = useGetConfig();
  const sections = filterSettingsNav(
    settingsSections(
      workspaceId,
      settings.data?.modules,
      config.data?.billingEnabled,
    ),
    query,
    (key) => t(key),
  );
  const first = sections[0]?.items[0];
  return (
    <div className="flex h-full min-h-0 w-full flex-col gap-2 px-2.5 pt-2 pb-3">
      <div className="flex h-11 shrink-0 items-center gap-1 ps-2">
        <p className="min-w-0 flex-1 truncate text-sm font-semibold">
          {t("team.nav.settings")}
        </p>
        <Button
          variant="ghost"
          size="xs"
          className="text-muted-foreground"
          render={<Link to={teamHref(workspaceId)} onClick={onNavigate} />}
        >
          <ArrowLeft aria-hidden="true" />
          {t("settings.back")}
        </Button>
      </div>
      <SearchField
        label={t("settings.search")}
        value={query}
        onChange={setQuery}
        onKeyDown={(event) => {
          if (event.key === "Escape") setQuery("");
          if (event.key !== "Enter" || !first) return;
          void navigate({ to: first.to });
          onNavigate?.();
        }}
      />
      <SidebarNav
        label={t("settings.navigation")}
        sections={sections}
        onNavigate={onNavigate}
      >
        {first ? null : (
          <p className="px-2 text-sm text-muted-foreground">
            {t("settings.noMatch")}
          </p>
        )}
      </SidebarNav>
      <SidebarItem
        item={{
          id: "docs",
          labelKey: "settings.docs",
          icon: BookOpen,
          to: brandText("https://kaneo.app/docs"),
          newTab: true,
        }}
      />
    </div>
  );
}
