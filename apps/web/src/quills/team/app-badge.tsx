import type { Viewer } from "../core/types";
import { useGetNotificationUnreadCount } from "../hooks/team/use-get-notification-unread-count";
import { useGetNotifications } from "../ui/upstream";
import { useDesktopBadge } from "./desktop-badge";

export interface AppBadgeProps {
  workspaceId: string;
  viewer: Viewer;
  /** False when the person cannot read Quills: the badge counts the Kaneo inbox only. */
  quills: boolean;
}

/**
 * The unread Kaneo inbox and Quills activity on the desktop app's Dock icon. The Kaneo sidebar and
 * the teammate app shell mount it. Kaneo's settings pages do not, so there the badge is clear.
 */
export function AppBadge({ workspaceId, viewer, quills }: AppBadgeProps) {
  // Only the desktop app has a badge: a browser makes no request for it. An empty id turns a
  // query off.
  const desktop = "__TAURI_INTERNALS__" in window ? workspaceId : "";
  const inbox = useGetNotifications(desktop);
  const activity = useGetNotificationUnreadCount(
    { param: { workspaceId: quills ? desktop : "" } },
    viewer,
  );
  const unread = (inbox.data ?? []).filter((item) => !item.isRead).length;
  useDesktopBadge(unread + (activity.data?.count ?? 0));
  return null;
}
