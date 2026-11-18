import { closestCorners, DndContext, DragOverlay } from "@dnd-kit/core";
import { arrayMove, SortableContext } from "@dnd-kit/sortable";
import { useReducedMotion } from "motion/react";
import { useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import type { ListStatusesResponse } from "../../../api/team/list-statuses";
import { statusProgress } from "../../../core/status-progress";
import { useReorderStatuses } from "../../../hooks/team/use-reorder-statuses";
import { useSetPostStatus } from "../../../hooks/team/use-set-post-status";
import { useTeamRuntime } from "../../../team/runtime";
import { toast } from "../../../ui/upstream";
import { useCollapsedColumns } from "../collapsed-columns";
import { roadmapAnnouncements } from "../roadmap-announcements";
import { useRoadmapSensors } from "../use-roadmap-sensors";
import {
  canDrop,
  columnCount,
  itemOf,
  landingCard,
  type DragItem,
  type PendingMove,
  type RoadmapPost,
} from "../roadmap-moves";
import { RoadmapColumn } from "./roadmap-column";
import { dropAnimation, RoadmapDragPreview } from "./roadmap-drag-preview";
import { RoadmapHiddenColumns } from "./roadmap-hidden-columns";

type Status = ListStatusesResponse["statuses"][number];

export interface RoadmapBoardProps {
  workspaceId: string;
  /** The statuses in list order. */
  statuses: readonly Status[];
  /** Board names by ID. */
  boards: ReadonlyMap<string, string>;
  /** The post counts by status ID. */
  counts: ReadonlyMap<string, number>;
  /** Shows only the posts of this board. */
  boardId?: string | null;
  /** The statuses that the current tab shows; the rest stay in the saved column order. */
  show?: (status: Status) => boolean;
  /** Opens New request in a status. Left out without the create permission. */
  onCreate?: (statusId: string) => void;
  /** Opens a card's Create task or Link existing task dialog (RFC 0005). Stable: the cards are memoized. */
  onTask?: (post: RoadmapPost, kind: "create" | "link") => void;
}

/** The roadmap columns. A card drag changes the post status; a column drag reorders the statuses. */
export function RoadmapBoard({ workspaceId, ...props }: RoadmapBoardProps) {
  const { t } = useTranslation("quills");
  const team = useTeamRuntime();
  const setStatus = useSetPostStatus(team.viewer);
  const reorder = useReorderStatuses(team.viewer);
  // The mutate functions are stable; the mutation objects are new on each render.
  const saveStatus = setStatus.mutateAsync;
  const [moves, setMoves] = useState<ReadonlyMap<string, PendingMove>>(
    new Map(),
  );
  const [collapsed, toggle] = useCollapsedColumns(workspaceId);
  const [dragged, setDragged] = useState<DragItem | null>(null);
  const [overId, setOverId] = useState<string | null>(null);
  const [focusId, setFocusId] = useState<string | null>(null);
  const clearFocus = useCallback(() => setFocusId(null), []);
  const sensors = useRoadmapSensors();
  const reduceMotion = useReducedMotion();
  const byId = useMemo(
    () => new Map(props.statuses.map((status) => [status.id, status])),
    [props.statuses],
  );
  const savedOrder = useMemo(
    () => props.statuses.map((status) => status.id),
    [props.statuses],
  );
  // A new column order shows at once. A failed save brings back the saved order.
  const order =
    (reorder.isPending && reorder.variables?.json.statusIds) || savedOrder;
  const columns = useMemo(
    () => order.flatMap((id) => byId.get(id) ?? []),
    [order, byId],
  );

  // Stable while no move is pending, so the memoized card lists do not render again.
  const move = useCallback(
    (post: RoadmapPost, to: string, byMenu = false) => {
      if (to === (moves.get(post.id)?.to ?? post.statusId)) return;
      const entry = { post, to };
      setMoves((current) => new Map(current).set(post.id, entry));
      // A menu move unmounts the card with its menu: give the focus to the moved card, or to
      // the expand button of a collapsed column. A drag gets its focus back from dnd-kit.
      if (byMenu) {
        if (collapsed.includes(to))
          requestAnimationFrame(() =>
            document
              .querySelector<HTMLElement>(`[data-roadmap-toggle="${to}"]`)
              ?.focus(),
          );
        else setFocusId(post.id);
      }
      saveStatus({
        param: { workspaceId, postId: post.id },
        json: { statusId: to },
      })
        .catch(() => toast.error(t("team-roadmap.moveFailed")))
        .finally(() =>
          setMoves((current) => {
            if (current.get(post.id) !== entry) return current;
            const next = new Map(current);
            next.delete(post.id);
            return next;
          }),
        );
    },
    [moves, collapsed, saveStatus, workspaceId, t],
  );
  const reorderColumn = (from: string, to: string) =>
    void reorder
      .mutateAsync({
        param: { workspaceId },
        json: {
          statusIds: arrayMove(order, order.indexOf(from), order.indexOf(to)),
        },
      })
      .catch(() => toast.error(t("team-roadmap.reorderFailed")));
  const announcements = useMemo(() => roadmapAnnouncements(t, byId), [t, byId]);
  const visible = props.show ? columns.filter(props.show) : columns;
  const hidden = visible.filter((status) => collapsed.includes(status.id));
  const column = (status: Status) => (
    <RoadmapColumn
      key={status.id}
      workspaceId={workspaceId}
      status={status}
      progress={statusProgress(columns, status.id)}
      count={columnCount(props.counts.get(status.id) ?? 0, moves, status.id)}
      boards={props.boards}
      boardId={props.boardId}
      statuses={columns}
      moves={moves}
      focusId={focusId}
      onFocused={clearFocus}
      collapsed={collapsed.includes(status.id)}
      dropTarget={
        dragged !== null &&
        overId === status.id &&
        canDrop(dragged, status.id, byId)
      }
      slot={landingCard(dragged, overId, status.id)}
      onToggle={() => toggle(status.id)}
      reorderable={team.permissions.manageSettings}
      onCreate={props.onCreate ? () => props.onCreate?.(status.id) : undefined}
      onMove={team.permissions.update ? move : undefined}
      onTask={team.permissions.update ? props.onTask : undefined}
    />
  );
  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      accessibility={{
        announcements,
        screenReaderInstructions: {
          draggable: t("team-roadmap.instructions"),
        },
      }}
      onDragStart={({ active }) => setDragged(itemOf(active) ?? null)}
      onDragOver={({ over }) => setOverId(itemOf(over)?.statusId ?? null)}
      onDragCancel={() => setDragged(null)}
      onDragEnd={({ active, over }) => {
        setDragged(null);
        const from = itemOf(active);
        const to = itemOf(over)?.statusId;
        if (!from || !to || !canDrop(from, to, byId)) return;
        if (from.type === "card") move(from.post, to);
        else reorderColumn(from.statusId, to);
      }}
    >
      <SortableContext items={order}>
        <div className="flex h-full w-max min-w-full gap-3 pe-12">
          {visible.filter((status) => !hidden.includes(status)).map(column)}
          {hidden.length ? (
            <RoadmapHiddenColumns>{hidden.map(column)}</RoadmapHiddenColumns>
          ) : null}
        </div>
      </SortableContext>
      <DragOverlay dropAnimation={reduceMotion ? null : dropAnimation}>
        {dragged ? (
          <RoadmapDragPreview
            workspaceId={workspaceId}
            item={dragged}
            boards={props.boards}
            statuses={columns}
          />
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
