import { useRef } from "react";

/** Fades in an item that arrives after the first render. No motion with reduced motion. */
export const arrivedClass =
  "transition-opacity duration-200 starting:opacity-0 motion-reduce:transition-none";

/**
 * Tells which ids were not in the list on its first render for a scope, such as a message
 * that arrives while a thread is open. A new scope, such as another conversation, starts again.
 */
export function useArrived(ids: readonly string[], scope: string) {
  const first = useRef<{ scope: string; ids: ReadonlySet<string> } | null>(
    null,
  );
  if (first.current?.scope !== scope)
    first.current = { scope, ids: new Set(ids) };
  const seen = first.current.ids;
  return (id: string) => !seen.has(id);
}
