import { portalHref } from "../core/portal-href";
import { portalSignInHref } from "../core/portal-sign-in-href";
import { useOptionalPortalRuntime } from "./runtime";

/**
 * The portal's sign-in link back to a portal page (`path` and `search` as for portalHref), by the
 * portal's sign-in mode; null when customer sign-in is off.
 */
export function usePortalSignInHref(workspaceId: string) {
  const signIn = useOptionalPortalRuntime()?.access?.signIn;
  return (path = "", search?: Record<string, string | undefined>) =>
    portalSignInHref(
      workspaceId,
      portalHref(workspaceId, path, search),
      signIn,
    );
}
