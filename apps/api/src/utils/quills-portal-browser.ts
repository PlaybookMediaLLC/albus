import { createHash, randomBytes, timingSafeEqual } from "node:crypto";

// The login CSRF guard of the Quills portal token sign-in. The sign-in starts in the browser that
// will use it: that browser gets a random HttpOnly cookie, and the grants of the flow carry a state
// made from the cookie and the workspace. The last step signs in only where the two match, so a
// link minted in another browser, for someone else's account, cannot sign this browser in. The
// workspace is part of the state, so a state seen by one workspace's login page is useless in
// another workspace.

/** `__Host-` (Secure, whole host, no Domain) where the API runs on HTTPS; a plain name on HTTP. */
export const portalBrowserCookie = (secure: boolean) =>
  secure ? "__Host-quills-portal-sign-in" : "quills-portal-sign-in";

/** Ten minutes: room for the host app's login page. */
export const PORTAL_BROWSER_MAX_AGE = 600;

export const portalBrowserState = (browser: string, workspaceId: string) =>
  createHash("sha256").update(`${browser}:${workspaceId}`).digest("hex");

export function newPortalBrowser(workspaceId: string) {
  const browser = randomBytes(32).toString("base64url");
  return { browser, state: portalBrowserState(browser, workspaceId) };
}

/** True when `state` was made from this browser's cookie for `workspaceId`. Constant time. */
export function isPortalBrowser(
  browser: string | null | undefined,
  workspaceId: string,
  state: string | undefined,
) {
  if (!browser || !state || !/^[0-9a-f]{64}$/.test(state)) return false;
  return timingSafeEqual(
    Buffer.from(portalBrowserState(browser, workspaceId), "hex"),
    Buffer.from(state, "hex"),
  );
}
