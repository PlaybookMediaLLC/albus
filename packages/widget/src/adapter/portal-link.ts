import type { Api } from "./api.js";

/**
 * Opens the portal with the identified visitor signed in (gap G-17). The tab opens on the click,
 * before the request, so a popup blocker lets it through; it then goes to the one-time link.
 */
export async function openPortalSignedIn(api: Api, next = "") {
  const tab = window.open("", "_blank");
  try {
    const { url } = await api.request<{ url: string }>(
      "POST",
      "/widget/portal-sign-in",
      { next },
    );
    if (tab) {
      tab.location.href = url;
      // After the navigation starts: a sandboxed widget frame may navigate only a tab it opened.
      tab.opener = null;
    } else window.open(url, "_blank", "noopener");
  } catch (error) {
    tab?.close();
    throw error;
  }
}
