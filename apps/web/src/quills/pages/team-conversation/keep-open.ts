import { useEffect, useMemo, useRef } from "react";

/**
 * The list with the open item kept in its place. A list refreshes after an item is read or
 * resolved and can leave the open item out (the Unread or Open list). The item then stays after
 * the nearest earlier item that is still listed, so Previous and Next move from it. `fresh` is the
 * open item as it is now (read, resolved); without it the row keeps its last listed state.
 */
export function keepOpen<T extends { id: string }>(
  items: readonly T[],
  previous: readonly T[],
  openId: string,
  fresh?: T,
): readonly T[] {
  if (!openId || items.some((item) => item.id === openId)) return items;
  const at = previous.findIndex((item) => item.id === openId);
  if (at < 0) return items;
  const listed = new Set(items.map((item) => item.id));
  const before = previous
    .slice(0, at)
    .reverse()
    .find((item) => listed.has(item.id));
  const insertAt = before
    ? items.findIndex((item) => item.id === before.id) + 1
    : 0;
  const kept = fresh?.id === openId ? fresh : previous[at]!;
  return [...items.slice(0, insertAt), kept, ...items.slice(insertAt)];
}

/**
 * The rows of a paged list, kept with keepOpen against the rows of the last render of the same
 * list: the open item leaves when the user moves on, and a new query (a search, another filter)
 * starts without it.
 */
export function useKeptOpen<T extends { id: string }>(
  pages: readonly { items: readonly T[] }[] | undefined,
  openId: string,
  fresh: T | undefined,
  query: unknown,
) {
  const key = JSON.stringify(query);
  const last = useRef<{ key: string; rows: readonly T[] }>({ key, rows: [] });
  const kept = useMemo(
    () =>
      keepOpen(
        pages?.flatMap((page) => page.items) ?? [],
        last.current.key === key ? last.current.rows : [],
        openId,
        fresh,
      ),
    [pages, openId, fresh, key],
  );
  useEffect(() => {
    last.current = { key, rows: kept };
  });
  return kept;
}
