import { useEffect, useState } from "react";
import type { Api } from "./api.js";
import type { WidgetPerson } from "../ui/types.js";

export type TeamPresence = { online: boolean; withinOfficeHours: boolean };

/**
 * The team's availability and up to four teammate avatars, read each time the panel opens while
 * messages are on. Both routes are public reads; a failure shows the default contact text.
 */
export function useWidgetTeam(
  api: Api,
  active: boolean,
  onPresence: (presence: TeamPresence) => void,
) {
  const [team, setTeam] = useState<{
    online: boolean;
    avatars: WidgetPerson[];
  } | null>(null);
  useEffect(() => {
    if (!active) return;
    const controller = new AbortController();
    const { signal } = controller;
    Promise.all([
      api.request<{ agentsOnline: boolean; withinOfficeHours: boolean }>(
        "GET",
        "/widget/presence",
        undefined,
        signal,
      ),
      api
        .request<{ items: Array<{ name: string; avatarUrl: string | null }> }>(
          "GET",
          "/widget/team-avatars",
          undefined,
          signal,
        )
        .catch(() => ({ items: [] })),
    ])
      .then(([presence, { items }]) => {
        setTeam({
          online: presence.agentsOnline,
          avatars: items.slice(0, 4).map((item) => ({
            name: item.name,
            ...(item.avatarUrl && { avatarUrl: item.avatarUrl }),
          })),
        });
        onPresence({
          online: presence.agentsOnline,
          withinOfficeHours: presence.withinOfficeHours,
        });
      })
      .catch(() => {});
    return () => controller.abort();
    // onPresence posts to the SDK; a new function each render must not read again.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [api, active]);
  return team ? { team } : {};
}
