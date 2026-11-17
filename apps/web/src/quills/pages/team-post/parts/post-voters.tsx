import { X } from "lucide-react";
import { useId } from "react";
import { useTranslation } from "react-i18next";
import type { GetPostResponse } from "../../../api/team/get-post";
import { shortDate } from "../../../core/short-date";
import { useListPostVoters } from "../../../hooks/team/use-list-post-voters";
import { useRemovePostVote } from "../../../hooks/team/use-remove-post-vote";
import { sourceKeys } from "../../../team/new-request/sources";
import { useTeamRuntime } from "../../../team/runtime";
import { PersonAvatar } from "../../../ui/person-avatar";
import { IconButton } from "../../../ui/inbox/icon-button";
import { Button } from "../../../ui/upstream";

export interface PostVotersProps {
  workspaceId: string;
  post: GetPostResponse;
}

const importance = {
  nice: "team-post.nice",
  important: "team-post.important",
  critical: "team-post.critical",
} as const;

/**
 * The voters of a post with their vote date and importance. A vote that the team added shows who
 * added it and where they heard it, and can be removed.
 */
export function PostVoters({ workspaceId, post }: PostVotersProps) {
  const { t, i18n } = useTranslation("quills");
  const team = useTeamRuntime();
  const heading = useId();
  const param = { workspaceId, postId: post.id };
  const voters = useListPostVoters(
    { param, query: { offset: "0", limit: "50" } },
    team.viewer,
  );
  const remove = useRemovePostVote(team.viewer);
  const items = voters.data?.pages.flatMap((page) => page.items) ?? [];
  const locked = !team.permissions.update;
  const failed = voters.error ?? remove.error;
  return (
    <section aria-labelledby={heading} className="grid gap-2">
      <h3 id={heading} className="text-sm font-medium">
        {t("team-post.voters")}
      </h3>
      {failed ? (
        <p role="alert" className="text-sm text-destructive-foreground">
          {t("core.problem.failed")}
        </p>
      ) : null}
      <ul className="grid max-h-80 grid-cols-1 gap-1 overflow-y-auto text-sm">
        {items.map((voter) => {
          const name = voter.displayName ?? t("team-post.anonymous");
          return (
            <li
              key={voter.principalId}
              className="flex min-h-10 items-center gap-2.5"
            >
              <PersonAvatar
                colored
                name={name}
                avatarUrl={voter.avatarUrl}
                className="size-8"
              />
              <span className="grid min-w-0 flex-1">
                <span className="truncate font-medium">{name}</span>
                <span className="truncate text-xs text-muted-foreground">
                  {t("team-post.votedOn", {
                    date: shortDate(voter.createdAt, i18n.language),
                  })}
                  {voter.importance
                    ? ` · ${t(importance[voter.importance])}`
                    : null}
                </span>
                {voter.addedByPrincipalId ? (
                  <span className="truncate text-xs text-muted-foreground">
                    {voter.sourceType && sourceKeys[voter.sourceType]
                      ? t("team-post.addedBySource", {
                          name: voter.addedByName ?? t("team-post.anonymous"),
                          source: t(sourceKeys[voter.sourceType]!),
                        })
                      : t("team-post.addedBy", {
                          name: voter.addedByName ?? t("team-post.anonymous"),
                        })}
                  </span>
                ) : null}
              </span>
              {voter.addedByPrincipalId && !locked ? (
                <IconButton
                  size="icon-xs"
                  label={t("team-post.removeVote", { name })}
                  disabled={remove.isPending}
                  onClick={() =>
                    remove.mutate({
                      param: { ...param, principalId: voter.principalId },
                    })
                  }
                >
                  <X aria-hidden="true" />
                </IconButton>
              ) : null}
            </li>
          );
        })}
      </ul>
      {voters.hasNextPage ? (
        <Button
          variant="ghost"
          size="sm"
          loading={voters.isFetchingNextPage}
          onClick={() => void voters.fetchNextPage()}
        >
          {t("team-post.moreVoters")}
        </Button>
      ) : null}
    </section>
  );
}
