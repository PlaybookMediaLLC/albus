// Route-module helper: framework/boundaries.test.ts checks its imports like a module that uses ../framework/define-route.
import { bool, record, str } from "../settings/area";

// The portal tabs in the stored `nav` list of the portal settings. The settings area
// (../settings/portal.ts) writes the list; the public config, the customer routes and the
// feeds read it here.

export const NAV_TABS = [
  "feedback",
  "roadmap",
  "changelog",
  "help",
  "support",
  "status",
] as const;
export type NavTab = (typeof NAV_TABS)[number];

/** The stored items that the settings read returns: each has a string ID and type. */
const items = (config: Record<string, unknown>) => {
  const list = record(config.nav).items;
  return (Array.isArray(list) ? list : [])
    .map(record)
    .filter(
      (item) => typeof item.id === "string" && typeof item.type === "string",
    );
};

/** On or off for each built-in tab. A tab that the stored list does not name is on. */
export function navTabs(config: Record<string, unknown>) {
  const stored = items(config);
  return Object.fromEntries(
    NAV_TABS.map((tab) => [
      tab,
      bool(stored.find((item) => item.type === tab)?.enabled, true),
    ]),
  ) as Record<NavTab, boolean>;
}

/** The custom link tabs that are on, in stored order: an http(s) URL and a 1-30 character label. */
export function navLinks(config: Record<string, unknown>) {
  return items(config)
    .flatMap((item) => {
      const label = str(item.label)?.trim();
      const url = str(item.url);
      return item.type === "link" &&
        bool(item.enabled, true) &&
        label &&
        label.length <= 30 &&
        url &&
        url.length <= 2048 &&
        /^https?:\/\//i.test(url)
        ? [{ label, url, newTab: bool(item.newTab, true) }]
        : [];
    })
    .slice(0, 20);
}
