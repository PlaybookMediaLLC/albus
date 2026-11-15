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

export interface RoadmapCardsProps {
  workspaceId: string;
  statusId: string;
  /** Board names by ID. */
  boards: ReadonlyMap<string, string>;
  /** Every status, for the Move to menu of the cards. */
  statuses: readonly { id: string; name: string }[];
  moves: ReadonlyMap<string, PendingMove>;
  /** The card that takes the focus when it mounts, after a move by its menu. */
  focusId?: string | null;
  onFocused?: () => void;
  /** Changes the status of a card. Left out without the update permission. */
  onMove?: (post: RoadmapPost, statusId: string, byMenu?: boolean) => void;
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
      query: { statusIds: statusId, sort: "votes", limit: "50" },
    },
    team.viewer,
  );
  const cards = columnPosts(
    posts.data?.pages.flatMap((page) => page.items) ?? [],
    props.moves,
    statusId,
  );
  return (
    <TeamStateView
      loading={posts.isPending}
      problem={posts.error}
      onRetry={() => void posts.refetch()}
    >
      <SortableContext items={cards.map((post) => post.id)}>
        <ul className="flex flex-col gap-2">
          {cards.map((post) => (
            <li key={post.id}>
              <RoadmapCard
                workspaceId={props.workspaceId}
                post={post}
                statusId={statusId}
                board={props.boards.get(post.boardId) ?? null}
                statuses={props.statuses}
                onMove={props.onMove}
                focus={post.id === props.focusId}
                onFocused={props.onFocused}
              />
            </li>
          ))}
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
