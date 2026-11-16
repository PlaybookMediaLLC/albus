import { useSortable } from "@dnd-kit/sortable";
import {
  FoldHorizontal,
  GripVertical,
  Plus,
  UnfoldHorizontal,
} from "lucide-react";
import { memo, useId } from "react";
import { useTranslation } from "react-i18next";
import type { ListStatusesResponse } from "../../../api/team/list-statuses";
import { IconButton } from "../../../ui/inbox/icon-button";
import { PostStatusIcon } from "../../../ui/inbox/post-status-icon";
import { Button, cn } from "../../../ui/upstream";
import type { DragItem, PendingMove, RoadmapPost } from "../roadmap-moves";
import { RoadmapCards } from "./roadmap-cards";

type Status = ListStatusesResponse["statuses"][number];

// The drag state of the column changes on each move of a drag; the card list does not need it.
const Cards = memo(RoadmapCards);

export interface RoadmapColumnProps {
  workspaceId: string;
  status: Status;
  /** How far the status is along the workflow (`statusProgress`). */
  progress: number;
  count: number;
  /** Board names by ID. */
  boards: ReadonlyMap<string, string>;
  /** Every status, for the Move to menu of the cards. */
  statuses: readonly Status[];
  moves: ReadonlyMap<string, PendingMove>;
  collapsed: boolean;
  /** A dragged item is over this column. */
  dropTarget: boolean;
  onToggle: () => void;
  /** Shows the drag handle that reorders the columns. */
  reorderable: boolean;
  /** Opens New request in this status. Left out without the create permission. */
  onCreate?: () => void;
  /** A card from another column that would land here: its place shows as a slot. */
  slot?: RoadmapPost | null;
  /** The card that takes the focus when it mounts, after a move by its menu. */
  focusId?: string | null;
  onFocused?: () => void;
  /** Changes the status of a card. Left out without the update permission. */
  onMove?: (post: RoadmapPost, statusId: string, byMenu?: boolean) => void;
}

/** A roadmap column of one status. A collapsed column is a narrow strip that loads nothing. */
export function RoadmapColumn({ status, ...props }: RoadmapColumnProps) {
  const { t } = useTranslation("quills");
  const id = useId();
  const data: DragItem = {
    type: "column",
    statusId: status.id,
    label: status.name,
  };
  const drag = useSortable({
    id: status.id,
    data,
    disabled: { draggable: !props.reorderable, droppable: false },
  });
  const icon = (
    <PostStatusIcon color={status.color} progress={props.progress} />
  );
  const panel = cn(
    "flex shrink-0 flex-col rounded-xl bg-muted/50 ring-ring/40 transition-shadow",
    props.dropTarget && "ring-2",
    // The lifted column follows the pointer; its place shows as a dashed outline.
    drag.isDragging &&
      "bg-transparent outline-2 outline-dashed outline-ring/40 *:invisible",
  );
  const name = (
    <h2 id={id} className="truncate text-sm font-semibold">
      {status.name}
    </h2>
  );
  const total = (
    <span className="text-xs text-muted-foreground tabular-nums">
      {props.count}
    </span>
  );
  const toggle = (
    <IconButton
      label={t(
        props.collapsed ? "team-roadmap.expand" : "team-roadmap.collapse",
        { name: status.name },
      )}
      // The board focuses this button after a menu move into the collapsed column.
      data-roadmap-toggle={status.id}
      onClick={props.onToggle}
    >
      {props.collapsed ? (
        <UnfoldHorizontal aria-hidden="true" />
      ) : (
        <FoldHorizontal aria-hidden="true" />
      )}
    </IconButton>
  );
  const handle = props.reorderable ? (
    <IconButton
      ref={drag.setActivatorNodeRef}
      label={t("team-roadmap.reorder", { name: status.name })}
      // touch-none: a touch drag moves the column instead of scrolling the board.
      className="cursor-grab touch-none text-muted-foreground"
      {...drag.attributes}
      {...drag.listeners}
    >
      <GripVertical aria-hidden="true" />
    </IconButton>
  ) : null;
  if (props.collapsed)
    return (
      <section
        ref={drag.setNodeRef}
        aria-labelledby={id}
        className={cn(panel, "w-11 items-center gap-2 py-2")}
      >
        {toggle}
        {handle}
        {icon}
        <div className="[writing-mode:vertical-rl]">{name}</div>
        {total}
      </section>
    );
  return (
    <section
      ref={drag.setNodeRef}
      aria-labelledby={id}
      className={cn(panel, "w-80")}
    >
      <div className="flex items-center gap-1.5 p-2">
        {handle}
        {icon}
        {name}
        {total}
        <span className="ms-auto flex">
          {props.onCreate ? (
            <IconButton
              label={t("team-roadmap.newIn", { name: status.name })}
              onClick={props.onCreate}
            >
              <Plus aria-hidden="true" />
            </IconButton>
          ) : null}
          {toggle}
        </span>
      </div>
      <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto px-2 pb-2">
        <Cards
          workspaceId={props.workspaceId}
          statusId={status.id}
          boards={props.boards}
          statuses={props.statuses}
          moves={props.moves}
          slot={props.slot}
          focusId={props.focusId}
          onFocused={props.onFocused}
          onMove={props.onMove}
        />
        {props.onCreate ? (
          <Button
            variant="ghost"
            size="sm"
            className="justify-start text-muted-foreground"
            onClick={props.onCreate}
          >
            <Plus aria-hidden="true" />
            {t("team.newRequest")}
          </Button>
        ) : null}
      </div>
    </section>
  );
}
