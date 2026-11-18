import {
  type DropAnimation,
  defaultDropAnimationSideEffects,
} from "@dnd-kit/core";
import { statusProgress } from "../../../core/status-progress";
import { PostStatusIcon } from "../../../ui/inbox/post-status-icon";
import { cn, EASE_OUT_CSS } from "../../../ui/upstream";
import type { DragItem } from "../roadmap-moves";
import { RoadmapCardBody } from "./roadmap-card-body";

/** The release of a drag, as on the Kaneo board: the lifted copy settles into its new place. */
export const dropAnimation: DropAnimation = {
  sideEffects: defaultDropAnimationSideEffects({
    styles: { active: { opacity: "0.8" } },
  }),
  duration: 250,
  easing: EASE_OUT_CSS,
};

// Lifted off the board: a slight tilt and a shadow that grow in as the drag starts.
const lifted =
  "cursor-grabbing rotate-1 scale-[1.03] shadow-lg ring-2 ring-ring/35 transition-[rotate,scale] duration-150 ease-out starting:rotate-0 starting:scale-100 motion-reduce:transition-none";

export interface RoadmapDragPreviewProps {
  workspaceId: string;
  item: DragItem;
  /** Board names by ID. */
  boards: ReadonlyMap<string, string>;
  statuses: readonly {
    id: string;
    name: string;
    color: string;
    category: string;
  }[];
}

/**
 * What follows the pointer during a drag: the whole card, or the column header with the shape
 * of its cards. It is a picture of the item: it has no link and no menu.
 */
export function RoadmapDragPreview({
  item,
  statuses,
  ...props
}: RoadmapDragPreviewProps) {
  if (item.type === "card")
    return (
      <div aria-hidden="true" className={cn("w-93 rounded-lg", lifted)}>
        <article className="relative rounded-lg border border-border bg-card p-3">
          <RoadmapCardBody
            preview
            workspaceId={props.workspaceId}
            post={item.post}
            statusId={item.statusId}
            board={props.boards.get(item.post.boardId) ?? null}
            statuses={statuses}
          />
        </article>
      </div>
    );
  const status = statuses.find((entry) => entry.id === item.statusId);
  return (
    <div
      aria-hidden="true"
      className={cn(
        "flex h-96 w-96 flex-col gap-2 rounded-xl border border-border bg-card p-2",
        lifted,
      )}
    >
      <div className="flex items-center gap-2 p-2 text-sm font-medium">
        {status ? (
          <PostStatusIcon
            color={status.color}
            progress={statusProgress(statuses, status.id)}
          />
        ) : null}
        {item.label}
      </div>
      {[0, 1, 2].map((index) => (
        <div key={index} className="h-20 rounded-lg border bg-background" />
      ))}
    </div>
  );
}
