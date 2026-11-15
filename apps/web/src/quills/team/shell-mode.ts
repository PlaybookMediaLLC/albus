/** What the app shell shows beside the page (settings spec 1.2). */
export type ShellMode = "app" | "settings" | "focus";

/**
 * The shell mode of a teammate app address: "settings" under /settings, "focus" for the
 * changelog editor, else "app". The router matches paths without letter case, so this does too.
 */
export function shellMode(pathname: string): ShellMode {
  const path = pathname.replace(/^\/feedback\/[^/]+/i, "");
  if (/^\/settings(?:\/|$)/i.test(path)) return "settings";
  if (/^\/changelog\/[^/]+\/?$/i.test(path)) return "focus";
  return "app";
}
