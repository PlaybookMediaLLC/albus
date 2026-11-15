import { useNavigate } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { useListBoards } from "../../../hooks/team/use-list-boards";
import { useListPosts } from "../../../hooks/team/use-list-posts";
import { useListStatuses } from "../../../hooks/team/use-list-statuses";
import { teamHref } from "../../../team/team-href";
import { useTeamRuntime } from "../../../team/runtime";
import { TeamStateView } from "../../../team/team-state-view";
import { Button } from "../../../ui/upstream";
import { RequestItem } from "./request-item";

export interface MemberRequestsProps {
  workspaceId: string;
  principalId: string;
}

/** The Requests tab: the visible posts that the member wrote, newest first. */
export function MemberRequests({
  workspaceId,
  principalId,
}: MemberRequestsProps) {
  const { t } = useTranslation("quills");
  const team = useTeamRuntime();
  const navigate = useNavigate();
  const posts = useListPosts(
    {
      param: { workspaceId },
      query: { authorPrincipalId: principalId, sort: "newest", limit: "20" },
    },
    team.viewer,
  );
  // The same requests as the inbox, so the names come from the cache.
  const statuses = useListStatuses(
    { param: { workspaceId }, query: { limit: "100" } },
    team.viewer,
  );
  const boards = useListBoards(
    { param: { workspaceId }, query: { offset: "0", limit: "100" } },
    team.viewer,
  );
  const items = posts.data?.pages.flatMap((page) => page.items) ?? [];
  const queries = [posts, statuses, boards];
  return (
    <TeamStateView
      loading={queries.some((query) => query.isLoading)}
      problem={queries.map((query) => query.error).find(Boolean)}
      onRetry={() => queries.forEach((query) => void query.refetch())}
    >
      {items.length ? (
        <ul aria-label={t("team-members.requests")}>
          {items.map((post) => {
            const href = teamHref(workspaceId, `/posts/${post.id}`);
            return (
              <li key={post.id}>
                <RequestItem
                  post={post}
                  boardName={
                    boards.data?.items.find((b) => b.id === post.boardId)?.name
                  }
                  status={statuses.data?.statuses.find(
                    (s) => s.id === post.statusId,
                  )}
                  href={href}
                  onOpen={() => void navigate({ to: href })}
                />
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="py-10 text-center text-sm text-muted-foreground">
          {t("team-members.noRequests")}
        </p>
      )}
      {posts.hasNextPage ? (
        <Button
          variant="ghost"
          className="w-full text-muted-foreground"
          onClick={() => void posts.fetchNextPage()}
          loading={posts.isFetchingNextPage}
        >
          {t("team-members.loadMoreRequests")}
        </Button>
      ) : null}
    </TeamStateView>
  );
}
