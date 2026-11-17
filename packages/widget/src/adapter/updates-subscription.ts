import { useEffect, useState } from "react";
import type { Api } from "./api.js";

const PATH = "/widget/changelog/subscription";

/**
 * Whether the identified visitor hears about new updates, read once for each session after the
 * panel opens. An anonymous visitor has no address for updates, so the toggle is not offered.
 */
export function useUpdatesSubscription(
  api: Api,
  session: number | null,
  identified: boolean,
  active: boolean,
) {
  const [state, setState] = useState<{
    session: number;
    subscribed: boolean;
  } | null>(null);
  useEffect(() => {
    if (session === null || !identified || !active) return;
    const controller = new AbortController();
    api
      .request<{ subscribed: boolean }>(
        "GET",
        PATH,
        undefined,
        controller.signal,
      )
      .then(({ subscribed }) => setState({ session, subscribed }))
      // No toggle when the read fails, for example while the changelog tab is off.
      .catch(() => {});
    return () => controller.abort();
  }, [api, session, identified, active]);
  if (!state || state.session !== session || !identified) return {};
  return {
    updatesSubscribed: state.subscribed,
    /** Resolves after the API confirms. */
    onSubscribeUpdates: async (subscribed: boolean) => {
      await api.request(subscribed ? "PUT" : "DELETE", PATH);
      setState((value) =>
        value?.session === session ? { session, subscribed } : value,
      );
    },
  };
}
