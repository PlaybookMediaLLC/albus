import { useNavigate } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { useListUserComments } from "../../../hooks/team/use-list-user-comments";
import { teamHref } from "../../../team/team-href";
import { useTeamRuntime } from "../../../team/runtime";
import { TeamStateView } from "../../../team/team-state-view";
import { Button } from "../../../ui/upstream";
import { CommentItem } from "./comment-item";

export interface MemberCommentsProps {
  workspaceId: string;
  principalId: string;
}

/** The Comments tab: the member's comments on visible posts, newest first. */
export function MemberComments({
  workspaceId,
  principalId,
}: MemberCommentsProps) {
  const { t } = useTranslation("quills");
  const team = useTeamRuntime();
  const navigate = useNavigate();
  const comments = useListUserComments(
    { param: { workspaceId, principalId }, query: { limit: "20" } },
    team.viewer,
  );
  const items = comments.data?.pages.flatMap((page) => page.items) ?? [];
  return (
    <TeamStateView
      loading={comments.isLoading}
      problem={comments.error}
      onRetry={() => void comments.refetch()}
    >
      {items.length ? (
        <ul aria-label={t("team-members.commentsTab")}>
          {items.map((comment) => {
            const href = teamHref(workspaceId, `/posts/${comment.postId}`);
            return (
              <li key={comment.id}>
                <CommentItem
                  comment={comment}
                  href={href}
                  onOpen={() => void navigate({ to: href })}
                />
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="py-10 text-center text-sm text-muted-foreground">
          {t("team-members.noComments")}
        </p>
      )}
      {comments.hasNextPage ? (
        <Button
          variant="ghost"
          className="w-full text-muted-foreground"
          onClick={() => void comments.fetchNextPage()}
          loading={comments.isFetchingNextPage}
        >
          {t("team-members.loadMoreComments")}
        </Button>
      ) : null}
    </TeamStateView>
  );
}
