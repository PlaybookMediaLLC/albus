/** The rail section of the app shell mode. */
export type ShellSection = "conversations" | "requests" | "workspace";

/**
 * The rail section of a teammate app address: conversations and tickets, requests and boards,
 * else the workspace views. The router matches paths without letter case, so this does too.
 */
export function shellSection(pathname: string): ShellSection {
  const path = pathname.replace(/^\/feedback\/[^/]+/i, "");
  if (/^\/(?:conversations|tickets|my-tickets)(?:\/|$)/i.test(path))
    return "conversations";
  if (/^\/(?:posts|boards)(?:\/|$)/i.test(path)) return "requests";
  return "workspace";
}
