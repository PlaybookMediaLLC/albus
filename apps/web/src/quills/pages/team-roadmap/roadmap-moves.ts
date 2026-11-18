import type { Active, Over } from "@dnd-kit/core";
import type { ListPostsResponse } from "../../api/team/list-posts";

export type RoadmapPost = ListPostsResponse["items"][number];

/** A status change that the API has not confirmed yet. `post` has the old status. */
export interface PendingMove {
  post: RoadmapPost;
  to: string;
}

/** The data of a dragged card or column. `statusId` is the column of the item. */
export type DragItem =
  | { type: "card"; post: RoadmapPost; statusId: string; label: string }
  | { type: "column"; statusId: string; label: string };

/**
 * True when a drop changes something: a card goes to another column, or a column moves to
 * another place in its status category. The status list keeps each category together.
 */
export function canDrop(
  from: DragItem,
  to: string,
  statuses: ReadonlyMap<string, { category: string }>,
) {
  return (
    from.statusId !== to &&
    (from.type === "card" ||
      statuses.get(from.statusId)?.category === statuses.get(to)?.category)
  );
}

/**
 * The cards of a column with the pending moves: a moved card leaves its old column and
 * joins the new column in vote order.
 */
export function columnPosts(
  posts: readonly RoadmapPost[],
  moves: ReadonlyMap<string, PendingMove>,
  statusId: string,
) {
  const incoming = [...moves.values()]
    .filter((move) => move.to === statusId)
    .map((move) => move.post);
  return [...posts.filter((post) => !moves.has(post.id)), ...incoming].sort(
    (a, b) => b.voteCount - a.voteCount,
  );
}

/** The post count of a column with the pending moves. */
export function columnCount(
  count: number,
  moves: ReadonlyMap<string, PendingMove>,
  statusId: string,
) {
  let total = count;
  for (const { post, to } of moves.values())
    total += Number(to === statusId) - Number(post.statusId === statusId);
  return total;
}

/** The card that would land in a column: a dragged card over another column than its own. */
export function landingCard(
  dragged: DragItem | null,
  overId: string | null,
  statusId: string,
) {
  return dragged?.type === "card" &&
    overId === statusId &&
    dragged.statusId !== statusId
    ? dragged.post
    : null;
}

/** The drag item of a dnd-kit node: a card or a column. */
export const itemOf = (node: Active | Over | null) =>
  node?.data.current as DragItem | undefined;
