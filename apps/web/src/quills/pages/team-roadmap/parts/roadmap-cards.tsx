import { SortableContext } from "@dnd-kit/sortable";
import { useTranslation } from "react-i18next";
import { useListPosts } from "../../../hooks/team/use-list-posts";
import { useTeamRuntime } from "../../../team/runtime";
import { TeamStateView } from "../../../team/team-state-view";
import { Button } from "../../../ui/upstream";
import {
  columnPosts,
  type PendingMove,
  type RoadmapPost,
} from "../roadmap-moves";
import { RoadmapCard } from "./roadmap-card";
import type { RoadmapCardBodyProps } from "./roadmap-card-body";

export interface RoadmapCardsProps {
  workspaceId: string;
  statusId: string;
  /** Board names by ID. */
  boards: ReadonlyMap<string, string>;
  /** Every status, for the Move to menu and the status icon of the cards. */
  statuses: RoadmapCardBodyProps["statuses"];
  /** Shows only the posts of this board. */
  boardId?: string | null;
  moves: ReadonlyMap<string, PendingMove>;
  /** A card from another column that would land here: a dashed slot shows its place. */
  slot?: RoadmapPost | null;
  /** The card that takes the focus when it mounts, after a move by its menu. */
  focusId?: string | null;
  onFocused?: () => void;
  /** Changes the status of a card. Left out without the update permission. */
  onMove?: (post: RoadmapPost, statusId: string, byMenu?: boolean) => void;
  onTask?: (post: RoadmapPost, kind: "create" | "link") => void;
}

/**
 * The cards of one status by votes, 50 at a time, with the pending moves. RoadmapColumn
 * memoizes it, so a drag over the board does not render the lists again.
 */
export function RoadmapCards({ statusId, ...props }: RoadmapCardsProps) {
  const { t } = useTranslation("quills");
  const team = useTeamRuntime();
  // ponytail: one listQuillsPosts per open column, and a move or any Quills change refetches
  // each of them. A route that returns the first page of every status makes it one request.
  const posts = useListPosts(
    {
      param: { workspaceId: props.workspaceId },
      query: {
        statusIds: statusId,
        sort: "votes",
        limit: "50",
        ...(props.boardId ? { boardIds: props.boardId } : {}),
      },
    },
    team.viewer,
  );
  const cards = columnPosts(
    posts.data?.pages.flatMap((page) => page.items) ?? [],
    props.moves,
    statusId,
  );
  // The columns sort by votes, so a dropped card lands before the first card with fewer votes.
  const slotAt = props.slot
    ? cards.findIndex((post) => post.voteCount < props.slot!.voteCount)
    : -1;
  const slotIndex = props.slot && slotAt === -1 ? cards.length : slotAt;
  const slotBox = (
    <div
      aria-hidden="true"
      className="mb-2 h-20 rounded-lg border-2 border-dashed border-ring/40 bg-ring/5"
    />
  );
  return (
    <TeamStateView
      loading={posts.isPending}
      rows={3}
      problem={posts.error}
      onRetry={() => void posts.refetch()}
    >
      <SortableContext items={cards.map((post) => post.id)}>
        {!cards.length && !props.slot ? (
          <p className="px-2 py-3 text-sm text-faint-foreground">
            {t("team-roadmap.columnEmpty")}
          </p>
        ) : null}
        <ul className="flex flex-col gap-2 empty:hidden">
          {cards.map((post, index) => (
            <li key={post.id}>
              {index === slotIndex ? slotBox : null}
              <RoadmapCard
                workspaceId={props.workspaceId}
                post={post}
                statusId={statusId}
                board={props.boards.get(post.boardId) ?? null}
                statuses={props.statuses}
                onMove={props.onMove}
                onTask={props.onTask}
                focus={post.id === props.focusId}
                onFocused={props.onFocused}
              />
            </li>
          ))}
          {props.slot && slotIndex === cards.length ? <li>{slotBox}</li> : null}
        </ul>
      </SortableContext>
      {posts.hasNextPage ? (
        <Button
          variant="ghost"
          size="sm"
          loading={posts.isFetchingNextPage}
          onClick={() => void posts.fetchNextPage()}
        >
          {t("team-roadmap.showMore")}
        </Button>
      ) : null}
    </TeamStateView>
  );
}
