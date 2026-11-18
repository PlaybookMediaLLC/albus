import { Link } from "@tanstack/react-router";
import { SquarePen, Star } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { GetTeamCountsResponse } from "../api/team/get-team-counts";
import { IconButton } from "../ui/inbox/icon-button";
import { teamSections } from "./nav";
import { useTeamRuntime } from "./runtime";
import type { ShellSection } from "./shell-section";
import type { Favorite } from "./favorites";
import { SidebarNav } from "./sidebar-nav";
import { teamHref } from "./team-href";

export interface TeamSidebarProps {
  workspaceId: string;
  /** The rail section whose views the sidebar lists. */
  section: ShellSection;
  counts?: GetTeamCountsResponse;
  /** The starred views, listed above the section's views. */
  favorites?: readonly Favorite[];
  /** Runs after a view is chosen, for example to close the sheet on small screens. */
  onNavigate?: () => void;
}

/**
 * The sidebar beside the rail: the section name, New request and the views of the section.
 * Settings is left out here because the rail has it. The bell has the notification settings.
 */
export function TeamSidebar({
  workspaceId,
  section,
  counts,
  favorites = [],
  onNavigate,
}: TeamSidebarProps) {
  const { t } = useTranslation("quills");
  const team = useTeamRuntime();
  const current = teamSections(workspaceId, counts).find(
    (item) => item.id === section,
  )!;
  const views = {
    ...current,
    items: current.items.filter((item) => item.id !== "settings"),
  };
  return (
    <div className="flex h-full min-h-0 w-full flex-col gap-2 px-2.5 pt-2 pb-3">
      <div className="flex h-11 shrink-0 items-center gap-1 ps-2">
        <p className="min-w-0 flex-1 truncate text-sm font-semibold">
          {t(current.labelKey)}
        </p>
        {team.permissions.create ? (
          <IconButton
            label={t("team.newRequest")}
            render={
              <Link
                to={teamHref(workspaceId, "/posts")}
                search={{ new: true }}
                onClick={onNavigate}
              />
            }
          >
            <SquarePen aria-hidden="true" />
          </IconButton>
        ) : null}
      </div>
      {favorites.length ? (
        <SidebarNav
          label={t("team.favorites")}
          className="flex-none"
          sections={[
            {
              id: "favorites",
              labelKey: "team.favorites",
              items: favorites.map((item) => ({
                id: item.path,
                label: item.label,
                icon: Star,
                // A starred address with a search matches only that search.
                to: item.path.split("?")[0]!,
                search: Object.fromEntries(
                  new URLSearchParams(item.path.split("?")[1] ?? ""),
                ),
                exact: true,
              })),
            },
          ]}
          onNavigate={onNavigate}
        />
      ) : null}
      <SidebarNav
        label={t("team.navigation")}
        sections={[views]}
        hideLabels
        onNavigate={onNavigate}
      />
    </div>
  );
}
