import { resolveApiBaseUrl } from "@kaneo/libs";
import { portalHref } from "./portal-href";

export type PortalSignInMode = {
  mode: "account" | "sso" | "disabled";
  ssoUrl: string | null;
};

/**
 * Where a portal "Sign in" link goes (gap G-24): the Kaneo sign-in page; in SSO mode the host app's
 * login page, which returns to the portal's signed step with a token; or nowhere when customer
 * sign-in is off. `redirect` is the portal page to come back to.
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
    const returnTo = `${api}/quills-public/signed/portal-sign-in?${new URLSearchParams(
      { workspace: workspaceId, ...(next && { next }) },
    )}`;
    const url = new URL(signIn.ssoUrl);
    url.searchParams.set("return_to", returnTo);
    return url.toString();
  }
  return `/auth/sign-in?redirect=${encodeURIComponent(redirect)}`;
}
