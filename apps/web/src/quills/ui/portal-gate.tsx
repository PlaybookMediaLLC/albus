import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import type { Audience } from "../core/types";
import { portalHref } from "../core/portal-href";
import { portalSignInHref } from "../core/portal-sign-in-href";
import { useOptionalPortalRuntime } from "../portal/runtime";
import { Button, getSafeRedirectPath } from "./upstream";

export interface PortalGateProps {
  workspaceId: string;
  audience: Audience;
  portalEnabled: boolean;
  accessGranted: boolean;
  signedIn: boolean;
  currentPath?: string;
  children: ReactNode;
}

export function PortalGate(props: PortalGateProps) {
  const { t } = useTranslation("quills");
  const signIn = useOptionalPortalRuntime()?.access?.signIn;
  if (!props.portalEnabled) return <p role="status">{t("core.portalOff")}</p>;
  if (
    !props.signedIn &&
    (props.audience === "signed-in" ||
      (props.audience !== "public" && !props.accessGranted))
  ) {
    const href = portalSignInHref(
      props.workspaceId,
      getSafeRedirectPath(props.currentPath) ?? portalHref(props.workspaceId),
      signIn,
    );
    if (!href) return <p role="status">{t("core.signInOff")}</p>;
    return (
      <div role="status">
        <p>{t("core.signInRequired")}</p>
        <Button render={<a href={href} />}>{t("core.signIn")}</Button>
      </div>
    );
  }
  if (props.audience !== "public" && !props.accessGranted) {
    return <p role="status">{t("core.noAccess")}</p>;
  }
  return props.children;
}
