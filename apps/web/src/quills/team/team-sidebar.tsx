import { brandText } from "@kaneo/branding";
import { Link } from "@tanstack/react-router";
import { LifeBuoy, SquarePen } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { GetTeamCountsResponse } from "../api/team/get-team-counts";
import { IconButton } from "../ui/inbox/icon-button";
import { UserAvatar } from "../ui/upstream";
import { DesktopNotifications } from "./desktop-notifications";
import { teamSections } from "./nav";
import { NotificationsButton } from "./notifications-button";
import { useTeamRuntime } from "./runtime";
import { SidebarNav } from "./sidebar-nav";
import { teamHref } from "./team-href";
import {
  WorkspaceSwitcher,
  type WorkspaceSwitcherProps,
} from "./workspace-switcher";

export interface TeamSidebarProps extends Pick<
  WorkspaceSwitcherProps,
  "workspaceName" | "workspaceLogo" | "workspaceRole"
> {
  workspaceId: string;
  counts?: GetTeamCountsResponse;
  /** Runs after a view is chosen, for example to close the sheet on small screens. */
  onNavigate?: () => void;
}

/**
 * The one sidebar of the teammate app (design section 1): the workspace, New request and
 * the bell, the Conversations, Requests and Workspace views, desktop notifications and Support.
 */
export function TeamSidebar({
  workspaceId,
  counts,
  onNavigate,
  ...workspace
}: TeamSidebarProps) {
  const { t } = useTranslation("quills");
  const team = useTeamRuntime();
  return (
    <div className="flex h-full min-h-0 w-full flex-col gap-3 px-3 py-3">
      <div className="flex items-center gap-0.5">
        <WorkspaceSwitcher workspaceId={workspaceId} {...workspace} />
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
        <NotificationsButton
          workspaceId={workspaceId}
          onNavigate={onNavigate}
        />
      </div>
      <SidebarNav
        label={t("team.navigation")}
        sections={teamSections(workspaceId, counts)}
        onNavigate={onNavigate}
      />
      <DesktopNotifications />
      <div className="flex items-center gap-2">
        <a
          href={brandText("https://kaneo.app/docs")}
          target="_blank"
          rel="noreferrer"
          className="flex h-8 min-w-0 flex-1 items-center gap-2 rounded-lg px-2 text-sm text-sidebar-foreground outline-none hover:bg-sidebar-accent hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
        >
          <LifeBuoy aria-hidden="true" className="size-4" />
          {t("team.support")}
        </a>
        <UserAvatar />
      </div>
    </div>
  );
}
