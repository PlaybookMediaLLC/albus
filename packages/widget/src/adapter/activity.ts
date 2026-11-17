import { useEffect, useState } from "react";
import type { Api } from "./api.js";
import type { RequestActivity } from "../ui/types.js";

type Feed = { items: RequestActivity[]; unreadCount: number };

/**
 * The identified visitor's activity on requests they follow (RFC 0005), read once for each session
 * after the panel opens. `onUnread` hears the unread count for the launcher badge. A failed read
 * shows no activity button.
 */
export function useWidgetActivity(
  api: Api,
  session: number | null,
  identified: boolean,
  active: boolean,
  onUnread: (count: number) => void,
) {
  const [feed, setFeed] = useState<{ session: number; feed: Feed } | null>(
    null,
  );
  useEffect(() => {
    if (session === null || !identified || !active) return;
    const controller = new AbortController();
    api
      .request<Feed>("GET", "/widget/activity", undefined, controller.signal)
      .then((result) => {
        setFeed({ session, feed: result });
        onUnread(result.unreadCount);
      })
      .catch(() => {});
    return () => controller.abort();
    // onUnread posts to the SDK; a new function each render must not reload the feed.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [api, session, identified, active]);
  const current = feed?.session === session ? feed.feed : null;
  if (!current || !identified) return {};
  return {
    activities: current.items,
    /** Resolves after the API confirms, with the authoritative unread count. */
    onReadActivity: async (id: string) => {
      const result = await api.request<{
        item: RequestActivity;
        unreadCount: number;
      }>("PUT", `/widget/activity/${encodeURIComponent(id)}/read`);
      setFeed((value) =>
        value?.session === session
          ? {
              session,
              feed: {
                items: value.feed.items.map((item) =>
                  item.id === id ? result.item : item,
                ),
                unreadCount: result.unreadCount,
              },
            }
          : value,
      );
      onUnread(result.unreadCount);
    },
  };
}
