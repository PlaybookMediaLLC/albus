import type { Api } from "./api.js";

const STATE_TIMEOUT_MS = 30_000;

/**
 * Opens the portal with the identified visitor signed in (gap G-17). The tab opens on the click, so
 * a popup blocker lets it through, at the account sign-in start: that page marks the tab's browser
 * and sends its state back here. This frame asks the API for the one-time link with that state and
 * hands the link to the tab. Only a tab this frame opened, on this origin, gets a link, and the
 * link works only in that browser (login CSRF).
 */
export async function openPortalSignedIn(api: Api, base: string, next = "") {
  const start = new URL(startPath(base), location.href);
  const tab = window.open(start.href, "_blank");
  if (!tab) throw new Error("The browser blocked the portal tab");
  try {
    const state = await stateFrom(tab, start.origin);
    const { url } = await api.request<{ url: string }>(
      "POST",
      "/widget/portal-sign-in",
      { next, state },
    );
    tab.postMessage({ type: "quills:portal-sign-in-url", url }, start.origin);
  } catch (error) {
    tab.close();
    throw error;
  }
}

/** `{api}/quills-public/{workspace}` → `{api}/auth/quills/portal-sign-in?…`. */
function startPath(base: string) {
  const match = /^(.*)\/quills-public\/([^/?#]+)\/?$/.exec(base);
  if (!match) throw new Error("The widget base is not a Quills workspace path");
  return `${match[1]}/auth/quills/portal-sign-in?${new URLSearchParams({
    via: "widget",
    workspace: decodeURIComponent(match[2]!),
  })}`;
}

function stateFrom(tab: Window, origin: string) {
  return new Promise<string>((resolve, reject) => {
    const stop = () => {
      clearTimeout(timer);
      window.removeEventListener("message", listen);
    };
    const timer = setTimeout(() => {
      stop();
      reject(new Error("The portal tab did not answer"));
    }, STATE_TIMEOUT_MS);
    const listen = (event: MessageEvent) => {
      const data = event.data as { type?: unknown; state?: unknown } | null;
      if (
        event.source !== tab ||
        event.origin !== origin ||
        data?.type !== "quills:portal-sign-in" ||
        typeof data.state !== "string"
      )
        return;
      stop();
      resolve(data.state);
    };
    window.addEventListener("message", listen);
  });
}
