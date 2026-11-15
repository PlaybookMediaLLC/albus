import { bool, record } from "./area";

/**
 * The widget tabs of a stored blob. Without a tabs object (a new workspace, also after other
 * writes) the tabs take today's defaults. An older stored tabs object keeps the older defaults
 * for a tab that it does not name. A tabs write stores all six tabs, so the rule holds after it.
 * The settings read and the public widget config both use this.
 */
export function widgetTabs(stored: Record<string, unknown>) {
  const fresh = stored.tabs === undefined;
  const storedTabs = record(stored.tabs);
  return {
    feedback: bool(storedTabs.feedback, true),
    changelog: bool(storedTabs.changelog, fresh),
    help: bool(storedTabs.help, false),
    messenger: bool(storedTabs.messenger, fresh),
    tickets: bool(storedTabs.tickets, true),
    home: bool(storedTabs.home, true),
  };
}
