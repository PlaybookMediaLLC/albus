import { useSyncExternalStore } from "react";
import { useUserPreferencesStore } from "../ui/upstream";

const query = "(prefers-color-scheme: dark)";
const media = () => window.matchMedia?.(query);
const subscribe = (change: () => void) => {
  const list = media();
  list?.addEventListener("change", change);
  return () => list?.removeEventListener("change", change);
};
const systemDark = () => media()?.matches ?? false;

/**
 * True when the viewer's Kaneo theme is dark, also for "system" on a dark device. It reads the
 * theme store, not the document class, so a theme change renders again at once.
 */
export function useDarkTheme() {
  const theme = useUserPreferencesStore((state) => state.theme);
  const system = useSyncExternalStore(subscribe, systemDark, () => false);
  return theme === "dark" || (theme === "system" && system);
}
