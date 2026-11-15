import { useLocation } from "@tanstack/react-router";
import { Menu } from "lucide-react";
import { type ReactNode, useState } from "react";
import { useTranslation } from "react-i18next";
import { useGetTeamCounts } from "../hooks/team/use-get-team-counts";
import { IconButton } from "../ui/inbox/icon-button";
import {
  cn,
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from "../ui/upstream";
import { useTeamRuntime } from "./runtime";
import { SettingsSidebar } from "./settings-sidebar";
import { shellMode } from "./shell-mode";
import { TeamSidebar, type TeamSidebarProps } from "./team-sidebar";

export type TeamShellProps = Omit<TeamSidebarProps, "counts" | "onNavigate"> & {
  children: ReactNode;
};

/**
 * The teammate app layout (RFC 0004 revision 2): one light sidebar and the white main
 * surface. Below md the sidebar opens as a sheet from a menu button in a top bar. The
 * path picks the sidebar: the app, the settings or none (settings spec 1.2).
 */
export function TeamShell({ children, ...sidebar }: TeamShellProps) {
  const { t } = useTranslation("quills");
  const team = useTeamRuntime();
  const mode = useLocation({
    select: (location) => shellMode(location.pathname),
  });
  // The counts are only labels: a refused or failed request shows none.
  const counts = useGetTeamCounts(
    { param: { workspaceId: mode === "app" ? sidebar.workspaceId : "" } },
    team.viewer,
  );
  const [menuOpen, setMenuOpen] = useState(false);
  const nav = (onNavigate?: () => void) =>
    mode === "settings" ? (
      <SettingsSidebar
        workspaceId={sidebar.workspaceId}
        workspaceName={sidebar.workspaceName}
        workspaceLogo={sidebar.workspaceLogo}
        onNavigate={onNavigate}
      />
    ) : (
      <TeamSidebar {...sidebar} counts={counts.data} onNavigate={onNavigate} />
    );
  return (
    <div className="flex h-svh min-h-0 w-full flex-col bg-sidebar md:flex-row">
      {mode === "focus" ? null : (
        <>
          <div className="flex items-center gap-2 border-b border-border px-2 py-1.5 md:hidden">
            <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
              <SheetTrigger render={<IconButton label={t("team.menu")} />}>
                <Menu aria-hidden="true" />
              </SheetTrigger>
              <SheetContent
                side="left"
                className="w-75 max-w-[85vw] bg-sidebar p-0"
              >
                <SheetTitle className="sr-only">
                  {t(
                    mode === "settings"
                      ? "settings.navigation"
                      : "team.navigation",
                  )}
                </SheetTitle>
                {nav(() => setMenuOpen(false))}
              </SheetContent>
            </Sheet>
            <p className="truncate text-sm font-semibold">
              {sidebar.workspaceName}
            </p>
          </div>
          <div className="hidden w-75 shrink-0 md:flex">{nav()}</div>
        </>
      )}
      <main
        className={cn(
          "min-h-0 min-w-0 flex-1 overflow-auto bg-background",
          mode !== "focus" &&
            "md:my-2 md:me-2 md:rounded-xl md:border md:border-border md:shadow-xs",
        )}
      >
        {children}
      </main>
    </div>
  );
}
