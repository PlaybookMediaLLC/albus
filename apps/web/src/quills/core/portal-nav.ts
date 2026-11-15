/** A portal tab as `getQuillsPortalSettings` returns it. */
export interface PortalNavItem {
  id: string;
  type: string;
  enabled: boolean;
  label: string | null;
  url: string | null;
  newTab: boolean;
}

export type PortalNavType =
  | "feedback"
  | "roadmap"
  | "changelog"
  | "help"
  | "support"
  | "status"
  | "link";

/** A tab that the stored list does not name shows on the portal. */
export const navEnabled = (
  nav: readonly PortalNavItem[],
  type: PortalNavType,
) => nav.find((item) => item.type === type)?.enabled ?? true;

/**
 * The full tab list for `updateQuillsPortalSettings`, with one tab type on or off. The API
 * saves the list whole, so every other tab goes back as it was stored.
 */
export function withNavItem(
  nav: readonly PortalNavItem[],
  type: PortalNavType,
  enabled: boolean,
) {
  const items = nav.some((item) => item.type === type)
    ? nav
    : [
        ...nav,
        { id: type, type, enabled, label: null, url: null, newTab: true },
      ];
  return items.map((item) => ({
    id: item.id,
    // The API checked the type against this list when it stored the tab.
    type: item.type as PortalNavType,
    enabled: item.type === type ? enabled : item.enabled,
    ...(item.label !== null && { label: item.label }),
    ...(item.type === "link" &&
      item.url !== null && { url: item.url, newTab: item.newTab }),
  }));
}
