import { useEffect, useMemo, useRef } from "react";

/**
 * The list with the open item kept in its place. A list refreshes after an item is read or
 * resolved and can leave the open item out (the Unread or Open list). The item then stays after
 * the nearest earlier item that is still listed, so Previous and Next move from it.
 */
export function keepOpen<T extends { id: string }>(
  items: readonly T[],
  previous: readonly T[],
  openId: string,
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
  return [...items.slice(0, insertAt), previous[at]!, ...items.slice(insertAt)];
}

/**
 * The rows of a paged list, kept with keepOpen against the rows of the last render: the open item
 * leaves when the user moves on.
 */
export function useKeptOpen<T extends { id: string }>(
  pages: readonly { items: readonly T[] }[] | undefined,
  openId: string,
) {
  const last = useRef<readonly T[]>([]);
  const kept = useMemo(
    () =>
      keepOpen(
        pages?.flatMap((page) => page.items) ?? [],
        last.current,
        openId,
      ),
    [pages, openId],
  );
  useEffect(() => {
    last.current = kept;
  });
  return kept;
}
