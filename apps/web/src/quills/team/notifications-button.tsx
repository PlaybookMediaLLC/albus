import { Link } from "@tanstack/react-router";
import { Bell, Settings } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { plainText } from "../core/plain-text";
import { shortDate } from "../core/short-date";
import { useGetNotificationUnreadCount } from "../hooks/team/use-get-notification-unread-count";
import { useListNotifications } from "../hooks/team/use-list-notifications";
import { useMarkAllNotificationsRead } from "../hooks/team/use-mark-all-notifications-read";
import { useMarkNotificationRead } from "../hooks/team/use-mark-notification-read";
import { IconButton } from "../ui/inbox/icon-button";
import {
  Button,
  cn,
  Popover,
  PopoverPopup,
  PopoverTitle,
  PopoverTrigger,
} from "../ui/upstream";
import { desktopAllowed } from "./desktop-choice";
import { NotificationSettings } from "./notification-settings";
import { useTeamRuntime } from "./runtime";
import { teamHref } from "./team-href";
import { TeamStateView } from "./team-state-view";

export interface NotificationsButtonProps {
  workspaceId: string;
  /** Runs after a notification is opened, for example to close the sheet. */
  onNavigate?: () => void;
}

/**
 * The bell: the caller's Quills activity, newest first, with an unread dot. The gear opens the
 * notification settings in the same popover.
 */
export function NotificationsButton({
  workspaceId,
  onNavigate,
}: NotificationsButtonProps) {
  const { t, i18n } = useTranslation("quills");
  const team = useTeamRuntime();
  const [open, setOpen] = useState(false);
  // "back" is the list after the settings: the gear gets the focus again.
  const [view, setView] = useState<"list" | "settings" | "back">("list");
  const param = { workspaceId };
  const unread = useGetNotificationUnreadCount({ param }, team.viewer);
  const list = useListNotifications(
    { param: { workspaceId: open ? workspaceId : "" }, query: { limit: "20" } },
    team.viewer,
  );
  const readAll = useMarkAllNotificationsRead(team.viewer);
  const readOne = useMarkNotificationRead(team.viewer);
  const count = unread.data?.count ?? 0;
  const items = list.data?.notifications ?? [];

  // A new notification while the app is in the background shows on the desktop when allowed.
  const seen = useRef<number | null>(null);
  useEffect(() => {
    if (unread.data === undefined) return;
    const before = seen.current;
    seen.current = count;
    if (
      before === null ||
      count <= before ||
      !document.hidden ||
      !desktopAllowed()
    )
      return;
    try {
      new Notification(t("team.notifications.new", { count: count - before }), {
        // Each hidden tab refetches the count on the same change, so one tag shows it once. The
        // minute keeps a later return to the same count from replacing an old one in silence.
        // ponytail: tabs that refetch across a minute boundary each show it; a shared
        // BroadcastChannel would dedupe them exactly.
        tag: `quills-notifications:${workspaceId}:${count}:${Math.floor(Date.now() / 60_000)}`,
      });
    } catch {
      // ponytail: some mobile browsers allow notifications only from a service worker.
    }
  }, [count, unread.data, t, workspaceId]);

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next) setView("list");
      }}
    >
      <PopoverTrigger
        render={
          <IconButton
            size="icon-lg"
            className="relative text-muted-foreground hover:bg-sidebar-accent hover:text-foreground"
            side="right"
            label={
              count
                ? t("team.notifications.unread", { count })
                : t("team.notifications.title")
            }
          />
        }
      >
        <Bell aria-hidden="true" className="size-4.5" />
        {count ? (
          <span
            aria-hidden="true"
            className="absolute end-1 top-1 size-2 rounded-full bg-warning"
          />
        ) : null}
      </PopoverTrigger>
      <PopoverPopup
        side="right"
        align="end"
        // A fixed height from the first render: the positioner measures the panel once when it
        // opens (often while the list loads) and does not move when the content grows later.
        className="h-[min(32rem,calc(100dvh-2rem))] w-80"
      >
        {view === "settings" ? (
          <NotificationSettings
            workspaceId={workspaceId}
            onBack={() => setView("back")}
          />
        ) : (
          <div className="p-3">
            <div className="mb-2 flex items-center gap-1">
              <PopoverTitle className="flex-1 text-sm">
                {t("team.notifications.activity")}
              </PopoverTitle>
              {count ? (
                <Button
                  variant="ghost"
                  size="xs"
                  loading={readAll.isPending}
                  onClick={() => readAll.mutate({ param })}
                >
                  {t("team.notifications.readAll")}
                </Button>
              ) : null}
              <IconButton
                label={t("team.notifications.settings")}
                autoFocus={view === "back"}
                onClick={() => setView("settings")}
              >
                <Settings aria-hidden="true" />
              </IconButton>
            </div>
            <TeamStateView
              loading={list.isLoading}
              problem={list.error ?? readAll.error ?? null}
            >
              {items.length ? (
                <ul className="-mx-2 grid max-h-96 gap-0.5 overflow-y-auto">
                  {items.map((item) => (
                    <li key={item.id}>
                      <Link
                        to={teamHref(
                          workspaceId,
                          item.postId
                            ? `/posts/${encodeURIComponent(item.postId)}`
                            : "",
                        )}
                        onClick={() => {
                          if (!item.readAt)
                            readOne.mutate({
                              param: { workspaceId, notificationId: item.id },
                            });
                          setOpen(false);
                          onNavigate?.();
                        }}
                        className="grid gap-0.5 rounded-lg px-2 py-2 text-sm outline-none hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring"
                      >
                        <span
                          className={cn(
                            "flex items-center gap-2",
                            !item.readAt && "font-medium",
                          )}
                        >
                          <span className="min-w-0 flex-1 truncate">
                            {item.title}
                          </span>
                          {item.readAt ? null : (
                            <span className="sr-only">{t("inbox.unread")}</span>
                          )}
                          <time
                            dateTime={item.createdAt}
                            className="shrink-0 text-xs font-normal text-muted-foreground"
                          >
                            {shortDate(item.createdAt, i18n.language)}
                          </time>
                        </span>
                        {item.body ? (
                          <span className="truncate text-xs text-muted-foreground">
                            {plainText(item.body)}
                          </span>
                        ) : null}
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : (
                <div role="status" className="grid gap-1 py-8 text-center">
                  <p className="text-sm font-medium">
                    {t("team.notifications.empty")}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {t("team.notifications.emptyText")}
                  </p>
                </div>
              )}
            </TeamStateView>
          </div>
        )}
      </PopoverPopup>
    </Popover>
  );
}
