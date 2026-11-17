import { useState } from "react";

/** Fades in an item that arrives after the first render. No motion with reduced motion. */
export const arrivedClass =
  "transition-opacity duration-200 starting:opacity-0 motion-reduce:transition-none";

/**
 * Tells which ids of a list in time order came after the newest id of its first render, such
 * as a message that arrives while a thread is open. Older history loaded above does not count.
 * A new scope, such as another conversation, starts again.
 */
export function useArrived(ids: readonly string[], scope: string) {
  const [first, setFirst] = useState(() => ({ scope, last: ids.at(-1) }));
  let last = first.last;
  if (first.scope !== scope) {
    last = ids.at(-1);
    setFirst({ scope, last });
  }
  const index = last === undefined ? -1 : ids.indexOf(last);
  // The newest id of the first render is gone (or never was): nothing counts as new.
  const arrived = new Set(
    last === undefined || index >= 0 ? ids.slice(index + 1) : [],
  );
  return (id: string) => arrived.has(id);
}
