import { ArrowUp, EllipsisVertical } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { GetPostResponse } from "../../../api/team/get-post";
import { useListPostVoters } from "../../../hooks/team/use-list-post-voters";
import { useRemovePostVote } from "../../../hooks/team/use-remove-post-vote";
import { useVotePost } from "../../../hooks/team/use-vote-post";
import { useTeamRuntime } from "../../../team/runtime";
import { IconButton } from "../../../ui/inbox/icon-button";
import { PersonAvatar } from "../../../ui/person-avatar";
import {
  Button,
  Popover,
  PopoverPopup,
  PopoverTrigger,
  toast,
} from "../../../ui/upstream";
import { AddVoter } from "./add-voter";
import { PostVoters } from "./post-voters";

export interface PostVotesProps {
  workspaceId: string;
  post: GetPostResponse;
}

const STACK = 4;

/**
 * The votes of a request: the voter avatars open the voters, the pill adds or removes the
 * teammate's own vote, and the kebab adds a vote for a customer.
 */
export function PostVotes({ workspaceId, post }: PostVotesProps) {
  const { t } = useTranslation("quills");
  const team = useTeamRuntime();
  const param = { workspaceId, postId: post.id };
  // The same request as the voter list in the popover, so it comes from the cache.
  const voters = useListPostVoters(
    { param, query: { offset: "0", limit: "50" } },
    team.viewer,
  );
  const vote = useVotePost(team.viewer);
  const unvote = useRemovePostVote(team.viewer);
  const first = voters.data?.pages[0]?.items.slice(0, STACK) ?? [];
  const locked = !team.permissions.update;
  const pending = vote.isPending || unvote.isPending;
  // The target state while a change is pending. A refetch can land before the mutation settles,
  // so the state follows the mutation, not the refreshed post.
  const voted = vote.isPending || (!unvote.isPending && post.hasVoted);
  const count = post.voteCount + (voted === post.hasVoted ? 0 : voted ? 1 : -1);
  const failed = { onError: () => toast.error(t("core.problem.failed")) };
  const toggle = () =>
    post.hasVoted
      ? unvote.mutate(
          { param: { ...param, principalId: post.viewerPrincipalId } },
          failed,
        )
      : vote.mutate({ param }, failed);
  return (
    <div className="ms-auto flex items-center gap-2">
      {first.length ? (
        <Popover>
          <PopoverTrigger
            className="flex -space-x-1.5 rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-label={t("team-post.showVoters")}
          >
            {first.map((voter) => (
              <PersonAvatar
                key={voter.principalId}
                colored
                name={voter.displayName}
                avatarUrl={voter.avatarUrl}
                className="size-7 ring-2 ring-background"
              />
            ))}
          </PopoverTrigger>
          <PopoverPopup align="end" className="w-80">
            <PostVoters workspaceId={workspaceId} post={post} />
          </PopoverPopup>
        </Popover>
      ) : null}
      <div className="flex items-center">
        <Button
          variant="outline"
          size="sm"
          className="h-7 gap-1.5 rounded-s-md rounded-e-none px-2.5 aria-pressed:border-primary/40 aria-pressed:bg-primary/10 aria-pressed:text-primary"
          aria-pressed={voted}
          aria-label={t(
            voted ? "team-post.removeMyVote" : "team-post.addMyVote",
            {
              count,
            },
          )}
          disabled={locked || pending}
          onClick={toggle}
        >
          <ArrowUp aria-hidden="true" />
          {count}
        </Button>
        {locked ? null : (
          <Popover>
            <PopoverTrigger
              render={
                <IconButton
                  variant="outline"
                  className="-ms-px size-7 rounded-s-none rounded-e-md"
                  label={t("team-post.addVote")}
                />
              }
            >
              <EllipsisVertical aria-hidden="true" />
            </PopoverTrigger>
            <PopoverPopup variant="menu" align="end" className="w-80">
              <AddVoter workspaceId={workspaceId} post={post} />
            </PopoverPopup>
          </Popover>
        )}
      </div>
    </div>
  );
}
