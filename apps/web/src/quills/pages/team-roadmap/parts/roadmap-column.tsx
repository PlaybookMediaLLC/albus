import { useSortable } from "@dnd-kit/sortable";
import { Ellipsis, Eye, GripVertical, Plus } from "lucide-react";
import { memo, useId } from "react";
import { useTranslation } from "react-i18next";
import type { ListStatusesResponse } from "../../../api/team/list-statuses";
import { IconButton } from "../../../ui/inbox/icon-button";
import { PostStatusIcon } from "../../../ui/inbox/post-status-icon";
import {
  cn,
  Menu,
  MenuItem,
  MenuPopup,
  MenuTrigger,
} from "../../../ui/upstream";
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
  /** Shows only the posts of this board. */
  boardId?: string | null;
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
  onTask?: (post: RoadmapPost, kind: "create" | "link") => void;
}

/**
 * A roadmap column of one status: a header with the count, a menu and New request over a light
 * lane of cards. A hidden column is a row in the Hidden columns panel that loads nothing.
 */
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
  const name = (
    <h2 id={id} className="truncate text-sm font-medium">
      {status.name}
    </h2>
  );
  const total = (
    <span className="text-sm text-faint-foreground tabular-nums">
      {props.count}
    </span>
  );
  const handle = props.reorderable ? (
    <IconButton
      ref={drag.setActivatorNodeRef}
      label={t("team-roadmap.reorder", { name: status.name })}
      // touch-none: a touch drag moves the column instead of scrolling the board.
      className="cursor-grab touch-none text-muted-foreground opacity-0 transition-opacity group-hover/column:opacity-100 focus-visible:opacity-100 pointer-coarse:opacity-100 motion-reduce:transition-none"
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
        className={cn(
          "group/hidden flex h-11 items-center gap-2.5 rounded-lg border border-border bg-card ps-3 pe-1.5 ring-ring/40 transition-[box-shadow,border-color] duration-150 hover:border-foreground/15",
          props.dropTarget && "ring-2",
        )}
      >
        {icon}
        {name}
        <span className="ms-auto pe-1.5">{total}</span>
        <IconButton
          label={t("team-roadmap.expand", { name: status.name })}
          // The board focuses this button after a menu move into the hidden column.
          data-roadmap-toggle={status.id}
          className="opacity-0 transition-opacity group-hover/hidden:opacity-100 focus-visible:opacity-100 pointer-coarse:opacity-100 motion-reduce:transition-none"
          onClick={props.onToggle}
        >
          <Eye aria-hidden="true" />
        </IconButton>
      </section>
    );
  return (
    <section
      ref={drag.setNodeRef}
      aria-labelledby={id}
      className={cn(
        "group/column flex w-[min(24rem,calc(100vw-3rem))] shrink-0 flex-col",
        // The lifted column follows the pointer; its place shows as a dashed outline.
        drag.isDragging &&
          "outline-2 outline-dashed outline-ring/40 *:invisible",
      )}
    >
      <div className="flex h-11 shrink-0 items-center gap-2 ps-2.5 pe-1 [&_button]:text-muted-foreground [&_button:hover]:text-foreground">
        {icon}
        {name}
        {total}
        <span className="ms-auto flex items-center">
          {handle}
          <Menu>
            <MenuTrigger
              render={
                <IconButton
                  label={t("team-roadmap.options", { name: status.name })}
                />
              }
            >
              <Ellipsis aria-hidden="true" />
            </MenuTrigger>
            <MenuPopup align="end">
              <MenuItem onClick={props.onToggle}>
                {t("team-roadmap.collapse", { name: status.name })}
              </MenuItem>
            </MenuPopup>
          </Menu>
          {props.onCreate ? (
            <IconButton
              label={t("team-roadmap.newIn", { name: status.name })}
              onClick={props.onCreate}
            >
              <Plus aria-hidden="true" />
            </IconButton>
          ) : null}
        </span>
      </div>
      <div
        className={cn(
          "flex min-h-0 flex-1 flex-col gap-1.5 overflow-y-auto overscroll-contain rounded-xl bg-foreground/3 p-1.5 ring-ring/30 transition-[background-color,box-shadow] duration-150 motion-reduce:transition-none",
          // A dragged card over the column tints the lane where it lands.
          props.dropTarget && "bg-foreground/6 ring-1",
        )}
      >
        <Cards
          workspaceId={props.workspaceId}
          statusId={status.id}
          boards={props.boards}
          statuses={props.statuses}
          moves={props.moves}
          slot={props.slot}
          boardId={props.boardId}
          focusId={props.focusId}
          onFocused={props.onFocused}
          onMove={props.onMove}
          onTask={props.onTask}
        />
      </div>
    </section>
  );
}
