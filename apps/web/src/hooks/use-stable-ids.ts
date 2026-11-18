import { useMemo } from "react";

/**
 * The same id array while the ids and their order are unchanged. dnd-kit's
 * sortable context re-renders every item when its `items` array changes
 * identity, so a patched board would otherwise re-render whole columns.
 */
export function useStableIds(items: ReadonlyArray<{ id: string }>) {
  const key = items.map((item) => item.id).join("\n");
  return useMemo(() => (key ? key.split("\n") : []), [key]);
}
