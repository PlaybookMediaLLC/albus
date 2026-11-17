import { resolveApiBaseUrl } from "@kaneo/libs";
import { portalHref } from "./portal-href";

export type PortalSignInMode = {
  mode: "account" | "sso" | "disabled";
  ssoUrl: string | null;
};

/**
 * Where a portal "Sign in" link goes (gap G-24): the Kaneo sign-in page; in SSO mode the account
 * sign-in start, which marks this browser and then opens the host app's login page (so only this
 * browser can finish the sign-in); or nowhere when customer sign-in is off. `redirect` is the
 * portal page to come back to.
 */
export function portalSignInHref(
  workspaceId: string,
  redirect: string,
  signIn?: PortalSignInMode | null,
  apiBase = resolveApiBaseUrl(import.meta.env.VITE_API_URL),
  origin = window.location.origin,
): string | null {
  if (signIn?.mode === "disabled") return null;
  if (signIn?.mode === "sso" && signIn.ssoUrl) {
    const home = portalHref(workspaceId);
    const next = redirect.startsWith(`${home}/`)
      ? redirect.slice(home.length)
      : "";
    const api = apiBase.startsWith("/") ? `${origin}${apiBase}` : apiBase;
    return `${api}/auth/quills/portal-sign-in?${new URLSearchParams({
      via: "sso",
      workspace: workspaceId,
      ...(next && { next }),
    })}`;
  }
  return `/auth/sign-in?redirect=${encodeURIComponent(redirect)}`;
}
