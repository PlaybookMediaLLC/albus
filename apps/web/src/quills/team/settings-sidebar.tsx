import { brandText } from "@kaneo/branding";
import { Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, BookOpen } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useListSettings } from "../hooks/team/use-list-settings";
import { SearchField } from "../ui/inbox/search-field";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
  Button,
  getInitials,
  useGetConfig,
} from "../ui/upstream";
import { filterSettingsNav } from "./filter-settings-nav";
import { NotificationsButton } from "./notifications-button";
import { useTeamRuntime } from "./runtime";
import { settingsSections } from "./settings-nav";
import { SidebarItem } from "./sidebar-item";
import { SidebarNav } from "./sidebar-nav";
import { teamHref } from "./team-href";

export interface SettingsSidebarProps {
  workspaceId: string;
  workspaceName?: string;
  workspaceLogo?: string | null;
  /** Runs after an item is chosen, for example to close the sheet on small screens. */
  onNavigate?: () => void;
}

/**
 * The sidebar of the settings area (settings spec 1.3): the workspace, Back and the bell,
 * a search field, the settings sections and Docs.
 */
export function SettingsSidebar({
  workspaceId,
  workspaceName,
  workspaceLogo,
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
    <div className="flex h-full min-h-0 w-full flex-col gap-3 px-3 py-3">
      <div className="flex items-center gap-1">
        <div className="flex min-w-0 flex-1 items-center gap-2 px-2">
          <Avatar aria-hidden="true" className="size-6 rounded-md">
            {workspaceLogo ? (
              // quills-web-allow C3: the logo is decorative, so its image needs an empty alt.
              <AvatarImage src={workspaceLogo} alt="" />
            ) : null}
            <AvatarFallback className="rounded-md bg-primary text-[10px] font-semibold text-primary-foreground">
              {getInitials(workspaceName, "")}
            </AvatarFallback>
          </Avatar>
          <span className="min-w-0 truncate text-sm font-medium">
            {workspaceName}
          </span>
        </div>
        <Button
          variant="ghost"
          size="xs"
          className="text-muted-foreground"
          render={<Link to={teamHref(workspaceId)} onClick={onNavigate} />}
        >
          <ArrowLeft aria-hidden="true" />
          {t("settings.back")}
        </Button>
        <NotificationsButton
          workspaceId={workspaceId}
          onNavigate={onNavigate}
        />
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
