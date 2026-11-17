import type { ReactNode } from "react";
import { Outlet, useLocation, useParams } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { portalReturnPath } from "../core/portal-return-path";
import { portalSignInHref } from "../core/portal-sign-in-href";
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
  const section =
    currentPath
      .split(/[?#]/)[0]!
      .slice(portalHref(workspaceId).length)
      .split("/")[1] ?? "";
  const signInHref = portalSignInHref(
    workspaceId,
    portalReturnPath(currentPath),
    access.data?.signIn,
  );
  // A token sign-in that could not finish lands here (gaps G-17 and G-24).
  const signInNotice = new URLSearchParams(currentPath.split("?")[1] ?? "")
    .get("signIn")
    ?.replace(/[^a-z]/g, "");
  // Small screens have no room for the header action, so feedback pages float it at the bottom.
  const floatSubmit =
    nav.tabs.feedback &&
    ["", "boards", "posts", "roadmap", "changelog"].includes(section);

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
                ) : signInHref ? (
                  <a
                    className="bg-muted text-foreground hover:bg-muted/70"
                    href={signInHref}
                  >
                    {t("core.signIn")}
                  </a>
                ) : null}
                <a
                  className="hidden bg-primary text-primary-foreground hover:bg-primary/90 sm:inline-flex"
                  href={portalHref(workspaceId, "", { openFeedback: "1" })}
                >
                  {t("feedback.submit")}
                </a>
              </>
            }
          >
            {signInNotice ? (
              <p role="status" className="mb-4 text-sm text-muted-foreground">
                {signInNotice === "required"
                  ? t("core.signInWithAccount")
                  : t("core.signInLinkFailed")}
              </p>
            ) : null}
            <Outlet />
            {floatSubmit ? (
              <a
                className="fixed inset-x-0 bottom-[calc(1rem+env(safe-area-inset-bottom))] z-30 mx-auto w-fit rounded-full bg-primary px-5 py-3 font-medium text-primary-foreground shadow-lg outline-none hover:bg-primary/90 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 sm:hidden"
                href={portalHref(workspaceId, "", { openFeedback: "1" })}
              >
                {t("feedback.submit")}
              </a>
            ) : null}
          </PortalLayout>
        </PortalRuntimeProvider>
      ) : null}
    </StateView>
  );
}
