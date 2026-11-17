import { useEffect } from "react";

type TauriInternals = {
  invoke: (command: string, args: Record<string, unknown>) => Promise<unknown>;
};

/**
 * Shows the unread count on the desktop app's Dock icon (macOS: Tauri has no badge on Windows). Only the desktop app (Tauri)
 * defines `__TAURI_INTERNALS__`; in a browser this does nothing.
 */
export function setDesktopBadge(count: number) {
  const tauri = (window as { __TAURI_INTERNALS__?: TauriInternals })
    .__TAURI_INTERNALS__;
  void tauri
    ?.invoke("plugin:window|set_badge_count", {
      label: "main",
      value: count > 0 ? count : null,
    })
    .catch(() => {});
}

let owners = 0;

/** Keeps the badge at `count`. The badge clears when the last component that shows it unmounts. */
export function useDesktopBadge(count: number) {
  useEffect(() => setDesktopBadge(count), [count]);
  useEffect(() => {
    owners += 1;
    return () => {
      owners -= 1;
      if (owners === 0) setDesktopBadge(0);
    };
  }, []);
}
