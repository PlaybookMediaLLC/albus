import type { ReactNode } from "react";
import { Outlet, useLocation, useParams } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { portalReturnPath } from "../core/portal-return-path";
import { portalHref } from "../core/portal-href";
import { navOf } from "../core/portal-nav";
import { PortalNavigation } from "../ui/portal-navigation";
import type { PortalBranding } from "../core/types";
import { usePortalViewer } from "../core/use-portal-viewer";
import { useEvaluateMyPortalAccess } from "../hooks/portal/use-evaluate-my-portal-access";
import { useGetPublicPortalConfig } from "../hooks/portal/use-get-public-portal-config";
import { PortalShell } from "../ui/portal-shell";
import { StateView } from "../ui/state-view";
import { PortalAccountMenu } from "./portal-account-menu";
import { PortalSearch } from "./portal-search";
import { PortalRuntimeProvider } from "./runtime";

export interface PortalLayoutProps {
  workspaceName: string;
  branding: PortalBranding;
  children: ReactNode;
  actions?: ReactNode;
  navigation?: ReactNode;
}

export function PortalLayout({
  workspaceName,
  branding,
  children,
  actions,
  navigation,
}: PortalLayoutProps) {
  return (
    <PortalShell
      workspaceName={workspaceName}
      branding={branding}
      actions={actions}
      navigation={navigation}
    >
      {children}
    </PortalShell>
  );
}

export function PortalRoute() {
  const { t } = useTranslation("quills");
  const currentPath = useLocation({ select: (location) => location.href });
  const params = useParams({ strict: false });
  const workspaceId = String(params.workspaceId);
  const viewer = usePortalViewer();
  const input = { param: { workspace: workspaceId } };
  const config = useGetPublicPortalConfig(input, viewer);
  const access = useEvaluateMyPortalAccess(input, viewer);
  // The portal pages read the nav from the runtime, so this one fallback covers them all.
  const nav = navOf(config.data?.nav);

  return (
    <StateView
      loading={config.isLoading}
      problem={config.error ?? null}
      onRetry={() => void config.refetch()}
    >
      {config.data ? (
        <PortalRuntimeProvider
          value={{
            config: { ...config.data, nav },
            viewer,
            access: access.data ?? null,
            accessLoading: access.isLoading,
            accessProblem: access.error ?? null,
            retryAccess: () => void access.refetch(),
          }}
        >
          <PortalLayout
            workspaceName={config.data.name}
            branding={config.data.branding}
            navigation={
              <PortalNavigation
                workspaceId={workspaceId}
                currentPath={currentPath.split(/[?#]/)[0]}
                nav={nav}
              />
            }
            actions={
              <>
                <PortalSearch workspaceId={workspaceId} />
                {viewer.kind === "user" ? (
                  <PortalAccountMenu workspaceId={workspaceId} />
                ) : (
                  <a
                    className="bg-muted text-foreground hover:bg-muted/70"
                    href={`/auth/sign-in?redirect=${encodeURIComponent(portalReturnPath(currentPath))}`}
                  >
                    {t("core.signIn")}
                  </a>
                )}
                <a
                  className="hidden bg-primary text-primary-foreground hover:bg-primary/90 sm:inline-flex"
                  href={portalHref(workspaceId, "", { openFeedback: "1" })}
                >
                  {t("feedback.submit")}
                </a>
              </>
            }
          >
            <Outlet />
          </PortalLayout>
        </PortalRuntimeProvider>
      ) : null}
    </StateView>
  );
}
