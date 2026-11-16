import { brandText } from "@kaneo/branding";
import { Link } from "@tanstack/react-router";
import {
  LayoutGrid,
  LifeBuoy,
  Lightbulb,
  type LucideIcon,
  MessagesSquare,
  Settings,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import type { GetTeamCountsResponse } from "../api/team/get-team-counts";
import { IconButton } from "../ui/inbox/icon-button";
import { UserAvatar } from "../ui/upstream";
import { NotificationsButton } from "./notifications-button";
import type { ShellMode } from "./shell-mode";
import type { ShellSection } from "./shell-section";
import { teamHref } from "./team-href";
import {
  WorkspaceSwitcher,
  type WorkspaceSwitcherProps,
} from "./workspace-switcher";

export interface TeamRailProps extends Pick<
  WorkspaceSwitcherProps,
  "workspaceName" | "workspaceLogo" | "workspaceRole"
> {
  workspaceId: string;
  mode: ShellMode;
  section: ShellSection;
  counts?: GetTeamCountsResponse;
  /** Runs after a section is chosen, for example to close the sheet on small screens. */
  onNavigate?: () => void;
}

// The inset ring of the current item leaves the focus ring visible. Use with size="icon-lg".
const item =
  "relative rounded-lg text-muted-foreground hover:bg-sidebar-accent hover:text-foreground aria-[current=page]:bg-background aria-[current=page]:text-foreground aria-[current=page]:shadow-xs aria-[current=page]:inset-ring aria-[current=page]:inset-ring-border";

/**
 * The thin column at the far left of the teammate app: the workspace, the Conversations,
 * Requests and Workspace sections, Settings, the bell, Support and the account. The sidebar
 * beside it lists the views of the current section. A warning dot marks a section with work.
 */
export function TeamRail({
  workspaceId,
  mode,
  section,
  counts,
  onNavigate,
  ...workspace
}: TeamRailProps) {
  const { t } = useTranslation("quills");
  const link = (
    label: string,
    Icon: LucideIcon,
    path: string,
    current: boolean,
    waiting = false,
  ) => (
    <li>
      <IconButton
        side="right"
        label={waiting ? t("team.railWaiting", { section: label }) : label}
        size="icon-lg"
        className={item}
        render={
          <Link
            to={teamHref(workspaceId, path)}
            // Exact, so the router never marks a section that `current` leaves out.
            activeOptions={{ exact: true, includeSearch: false }}
            aria-current={current ? "page" : undefined}
            onClick={onNavigate}
          />
        }
      >
        <Icon aria-hidden="true" className="size-4.5" />
        {waiting ? (
          <span
            aria-hidden="true"
            className="absolute end-1.5 top-1.5 size-1.5 rounded-full bg-warning"
          />
        ) : null}
      </IconButton>
    </li>
  );
  const app = mode === "app";
  return (
    <div className="flex h-full w-13 shrink-0 flex-col items-center gap-2 pt-2 pb-3">
      <div className="flex h-14 items-center">
        <WorkspaceSwitcher workspaceId={workspaceId} {...workspace} />
      </div>
      <nav
        aria-label={t("team.rail")}
        className="flex min-h-0 flex-1 flex-col items-center"
      >
        <ul className="flex flex-col items-center gap-1">
          {link(
            t("team.sections.conversations"),
            MessagesSquare,
            "/conversations/queue",
            app && section === "conversations",
            (counts?.queueConversations ?? 0) > 0,
          )}
          {link(
            t("team.sections.requests"),
            Lightbulb,
            "/posts",
            app && section === "requests",
            (counts?.postStatuses[0]?.count ?? 0) > 0,
          )}
          {link(
            t("team.sections.workspace"),
            LayoutGrid,
            "",
            app && section === "workspace",
          )}
        </ul>
        <ul className="mt-auto flex flex-col items-center gap-1">
          {link(
            t("team.nav.settings"),
            Settings,
            "/settings",
            mode === "settings",
          )}
        </ul>
      </nav>
      <div className="flex flex-col items-center gap-1">
        <NotificationsButton
          workspaceId={workspaceId}
          onNavigate={onNavigate}
        />
        <IconButton
          side="right"
          label={t("team.support")}
          size="icon-lg"
          className={item}
          render={
            <a
              href={brandText("https://kaneo.app/docs")}
              target="_blank"
              rel="noreferrer"
            />
          }
        >
          <LifeBuoy aria-hidden="true" className="size-4.5" />
        </IconButton>
        <UserAvatar />
      </div>
    </div>
  );
}
