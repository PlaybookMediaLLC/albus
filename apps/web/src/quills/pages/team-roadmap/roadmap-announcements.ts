import type { Active, Announcements, Over } from "@dnd-kit/core";
import { canDrop, type DragItem } from "./roadmap-moves";

type Translate = (key: string, options: Record<string, unknown>) => string;

const itemOf = (node: Active | Over | null) =>
  node?.data.current as DragItem | undefined;

/**
 * The screen-reader messages of a roadmap drag. A drop that changes nothing (the same column,
 * or a column into another status category) is a cancel, not a drop, and a column that refuses
 * the dragged item says so while the item is over it.
 */
export function roadmapAnnouncements(
  t: Translate,
  statuses: ReadonlyMap<string, { name: string; category: string }>,
): Announcements {
  const say = (key: string, active: Active, over: Over | null = null) =>
    t(key, {
      name: itemOf(active)?.label,
      column: statuses.get(itemOf(over)?.statusId ?? "")?.name,
    });
  const accepts = (active: Active, over: Over | null) => {
    const from = itemOf(active);
    const to = itemOf(over)?.statusId;
    return Boolean(from && to && canDrop(from, to, statuses));
  };
  return {
    onDragStart: ({ active }) => say("team-roadmap.picked", active),
    onDragOver: ({ active, over }) => {
      if (!over) return undefined;
      const home = itemOf(over)?.statusId === itemOf(active)?.statusId;
      return say(
        home || accepts(active, over)
          ? "team-roadmap.over"
          : "team-roadmap.notHere",
        active,
        over,
      );
    },
    onDragEnd: ({ active, over }) =>
      accepts(active, over)
        ? say("team-roadmap.dropped", active, over)
        : say("team-roadmap.cancelled", active),
    onDragCancel: ({ active }) => say("team-roadmap.cancelled", active),
  };
}
