import { ArrowUp } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useRemoveCommentReaction } from "../../../hooks/team/use-remove-comment-reaction";
import { useSetCommentReaction } from "../../../hooks/team/use-set-comment-reaction";
import { commentVoteEmoji } from "../../../core/reactions";
import { useTeamRuntime } from "../../../team/runtime";
import { Button, toast } from "../../../ui/upstream";

export interface CommentVoteProps {
  workspaceId: string;
  commentId: string;
  reactions: readonly { emoji: string; count: number; reacted: boolean }[];
}

/**
 * The vote pill of a comment. A vote is the 👍 reaction (D4 of the Requests parity plan), so the
 * count matches the comment votes of the widget.
 */
export function CommentVote({
  workspaceId,
  commentId,
  reactions,
}: CommentVoteProps) {
  const { t } = useTranslation("quills");
  const team = useTeamRuntime();
  const set = useSetCommentReaction(team.viewer);
  const remove = useRemoveCommentReaction(team.viewer);
  const vote = reactions.find(
    (reaction) => reaction.emoji === commentVoteEmoji,
  );
  const pending = set.isPending || remove.isPending;
  // The target state while a change is pending; it does not depend on when the refetch lands.
  const reacted = Boolean(vote?.reacted);
  const voted = set.isPending || (!remove.isPending && reacted);
  const count = (vote?.count ?? 0) + (voted === reacted ? 0 : voted ? 1 : -1);
  const input = {
    param: { workspaceId, commentId },
    query: { emoji: commentVoteEmoji },
  };
  const failed = { onError: () => toast.error(t("core.problem.failed")) };
  return (
    <Button
      variant="outline"
      size="xs"
      className="order-last ms-auto h-6 gap-1 rounded-full px-2 text-xs tabular-nums aria-pressed:border-primary/40 aria-pressed:bg-primary/10 aria-pressed:text-primary sm:h-6"
      aria-pressed={voted}
      aria-label={t("team-post.commentVotes", { count })}
      disabled={!team.permissions.update || pending}
      onClick={() =>
        vote?.reacted ? remove.mutate(input, failed) : set.mutate(input, failed)
      }
    >
      <ArrowUp aria-hidden="true" className="size-3" />
      {count}
    </Button>
  );
}
