import { Plus, Search } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import type { GetPostResponse } from "../../../api/team/get-post";
import { useAddPostProxyVote } from "../../../hooks/team/use-add-post-proxy-vote";
import { useCreateUser } from "../../../hooks/team/use-create-user";
import { useListPostVoters } from "../../../hooks/team/use-list-post-voters";
import { useListUsers } from "../../../hooks/team/use-list-users";
import { useTeamRuntime } from "../../../team/runtime";
import { PersonAvatar } from "../../../ui/person-avatar";
import { Button, toast, useDebouncedValue } from "../../../ui/upstream";

export interface AddVoterProps {
  workspaceId: string;
  post: GetPostResponse;
}

/**
 * Adds a vote for a customer: find a person by name or email, or create a customer with the
 * typed name and add the vote for them.
 */
export function AddVoter({ workspaceId, post }: AddVoterProps) {
  const { t } = useTranslation("quills");
  const team = useTeamRuntime();
  const [text, setText] = useState("");
  const name = text.trim();
  const search = useDebouncedValue(name, 300);
  const param = { workspaceId, postId: post.id };
  const users = useListUsers(
    {
      param: { workspaceId: search ? workspaceId : "" },
      query: { search, limit: "5" },
    },
    team.viewer,
  );
  const voters = useListPostVoters(
    { param, query: { offset: "0", limit: "50" } },
    team.viewer,
  );
  const add = useAddPostProxyVote(team.viewer);
  const create = useCreateUser(team.viewer);
  const voted = new Set(
    voters.data?.pages.flatMap((page) => page.items.map((v) => v.principalId)),
  );
  const busy = add.isPending || create.isPending;
  const failed = () => toast.error(t("core.problem.failed"));
  const addFor = (principalId: string, who: string) =>
    add.mutate(
      { param: { ...param, principalId } },
      {
        onSuccess: () => {
          setText("");
          toast.success(t("team-post.voteAdded", { name: who }));
        },
        onError: failed,
      },
    );
  return (
    <div className="grid">
      <label className="flex items-center gap-2 border-b border-border px-3">
        <Search aria-hidden="true" className="size-4 text-muted-foreground" />
        <span className="sr-only">{t("team-post.addVote")}</span>
        <input
          type="search"
          value={text}
          placeholder={t("team-post.searchMembers")}
          onChange={(event) => setText(event.target.value)}
          className="h-11 min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
        />
      </label>
      <ul className="grid gap-0.5 p-1.5">
        {search && users.data
          ? users.data.items
              .filter((user) => !voted.has(user.principalId))
              .map((user) => (
                <li key={user.principalId}>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start"
                    disabled={busy}
                    aria-label={t("team-post.addVoteFor", { name: user.name })}
                    onClick={() => addFor(user.principalId, user.name)}
                  >
                    <PersonAvatar
                      colored
                      name={user.name}
                      avatarUrl={user.image}
                      className="size-5"
                    />
                    <span className="truncate">{user.name}</span>
                  </Button>
                </li>
              ))
          : null}
        {name && team.permissions.create ? (
          <li>
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-between text-info-foreground"
              disabled={busy}
              onClick={() =>
                create.mutate(
                  { param: { workspaceId }, json: { name } },
                  {
                    onSuccess: (person) => addFor(person.principalId, name),
                    onError: failed,
                  },
                )
              }
            >
              <span className="truncate">
                {t("team-post.createMember", { name })}
              </span>
              <Plus aria-hidden="true" />
            </Button>
          </li>
        ) : null}
        {name ? null : (
          <li className="px-2 py-1.5 text-sm text-muted-foreground">
            {t("team-post.searchHint")}
          </li>
        )}
      </ul>
    </div>
  );
}
