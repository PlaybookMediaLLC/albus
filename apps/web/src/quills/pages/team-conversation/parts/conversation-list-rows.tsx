import type { useListConversations } from "../../../hooks/team/use-list-conversations";
import { TeamStateView } from "../../../team/team-state-view";
import type {
  Conversation,
  ListContext,
  Teammate,
} from "../../team-conversations/conversation-list";
import { ConversationRows } from "../../team-conversations/conversation-rows";

export interface ConversationListRowsProps {
  workspaceId: string;
  context: ListContext;
  /** The rows to show: the list's pages, with the open conversation kept in place. */
  items: readonly Conversation[];
  /** The list query, for its loading, failure and next page. */
  list: ReturnType<typeof useListConversations>;
  loading: boolean;
  /** True while the main pane shows a failure: the list then shows none of its own. */
  quiet: boolean;
  people: readonly Teammate[];
  activeId: string;
  onOpen: (id: string) => void;
}

/** The rows of the list beside an open conversation, with their states and "Load more". */
export function ConversationListRows({
  items,
  list,
  ...props
}: ConversationListRowsProps) {
  return (
    <TeamStateView
      loading={props.loading}
      problem={props.quiet ? null : (list.error ?? null)}
      empty={!items.length}
      onRetry={() => void list.refetch()}
    >
      <ConversationRows
        workspaceId={props.workspaceId}
        context={props.context}
        items={items}
        people={props.people}
        activeId={props.activeId}
        onOpen={props.onOpen}
        more={
          list.hasNextPage
            ? {
                loading: list.isFetchingNextPage,
                load: () => void list.fetchNextPage(),
              }
            : undefined
        }
      />
    </TeamStateView>
  );
}
