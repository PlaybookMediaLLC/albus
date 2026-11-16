import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useCreatePostFromConversation } from "../../../hooks/team/use-create-post-from-conversation";
import { useListPosts } from "../../../hooks/team/use-list-posts";
import { useTeamRuntime } from "../../../team/runtime";
import { CommandPalette } from "../../../ui/inbox/command-palette";
import { toast, useDebouncedValue } from "../../../ui/upstream";

export interface LinkRequestPaletteProps {
  workspaceId: string;
  conversationId: string;
  customerName: string;
  /** Requests already linked, which the search leaves out. */
  linkedIds: readonly string[];
  onClose: () => void;
}

/**
 * A search over the requests. The chosen one gets the customer's vote, is linked to the
 * conversation and is shared into the thread, so the customer sees it.
 */
export function LinkRequestPalette(props: LinkRequestPaletteProps) {
  const { t } = useTranslation("quills");
  const team = useTeamRuntime();
  const [query, setQuery] = useState("");
  const search = useDebouncedValue(query.trim(), 300);
  const found = useListPosts(
    {
      param: { workspaceId: search ? props.workspaceId : "" },
      query: { search, sort: "votes", limit: "8" },
    },
    team.viewer,
  );
  const link = useCreatePostFromConversation(team.viewer);
  const items = (found.data?.pages.flatMap((page) => page.items) ?? []).filter(
    (item) => !props.linkedIds.includes(item.id),
  );
  return (
    <CommandPalette
      open
      onOpenChange={(open) => {
        if (!open) props.onClose();
      }}
      label={t("team-conversations.links.linkRequest")}
      chip={t("team-conversations.links.linkRequest")}
      placeholder={t("team-conversations.links.findRequest", {
        name: props.customerName,
      })}
      query={query}
      onQueryChange={setQuery}
      items={search ? items : []}
      getKey={(item) => item.id}
      // The debounce counts as loading, so "No results" waits for the first search.
      loading={query.trim() !== search || (Boolean(search) && found.isFetching)}
      problem={search ? found.error : null}
      onRetry={() => void found.refetch()}
      renderItem={(item) => (
        <span className="flex items-center gap-2">
          <span className="min-w-0 flex-1 truncate">{item.title}</span>
          <span className="text-xs text-muted-foreground">
            {t("team-post.votes", { count: item.voteCount })}
          </span>
        </span>
      )}
      onSelect={(item) => {
        if (link.isPending) return;
        link.mutate(
          {
            param: {
              workspaceId: props.workspaceId,
              conversationId: props.conversationId,
            },
            json: { asUpvoteOfPostId: item.id },
          },
          {
            onSuccess: () => {
              toast.success(
                t("team-conversations.links.linked", {
                  title: item.title,
                  name: props.customerName,
                }),
              );
              props.onClose();
            },
            onError: () => toast.error(t("team-conversations.problem.failed")),
          },
        );
      }}
    />
  );
}
