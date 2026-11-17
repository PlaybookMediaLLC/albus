import { Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { plainText } from "../../../core/plain-text";
import { shortDate } from "../../../core/short-date";
import { useListConversations } from "../../../hooks/team/use-list-conversations";
import { useTeamRuntime } from "../../../team/runtime";
import { teamHref } from "../../../team/team-href";
import { PanelSection } from "../../../ui/inbox/panel-section";
import { Button, cn } from "../../../ui/upstream";

export interface PreviousConversationsProps {
  workspaceId: string;
  conversationId: string;
  visitorPrincipalId: string;
}

const statuses = {
  open: { dot: "bg-success", key: "team-conversations.history.open" },
  snoozed: { dot: "bg-warning", key: "team-conversations.history.snoozed" },
  closed: {
    dot: "bg-muted-foreground/50",
    key: "team-conversations.history.closed",
  },
} as const;

/** The customer's other conversations, newest first. Without any, the section is left out. */
export function PreviousConversations(props: PreviousConversationsProps) {
  const { t, i18n } = useTranslation("quills");
  const team = useTeamRuntime();
  const list = useListConversations(
    {
      param: { workspaceId: props.workspaceId },
      query: {
        visitorPrincipalId: props.visitorPrincipalId,
        sort: "recent",
        limit: "6",
      },
    },
    team.viewer,
  );
  const items = (list.data?.pages.flatMap((page) => page.items) ?? []).filter(
    (item) => item.id !== props.conversationId,
  );
  if (!items.length) return null;
  return (
    <PanelSection
      title={t("team-conversations.history.title")}
      count={list.hasNextPage ? undefined : items.length}
    >
      <ul className="-mx-2 grid">
        {items.map((item) => (
          <li key={item.id}>
            <Link
              to={teamHref(props.workspaceId, `/conversations/${item.id}`)}
              className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm outline-none hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring"
            >
              <span
                aria-hidden="true"
                className={cn(
                  "size-2 shrink-0 rounded-full",
                  statuses[item.status].dot,
                )}
              />
              <span className="sr-only">{t(statuses[item.status].key)}</span>
              <span className="min-w-0 flex-1 truncate">
                {item.subject || plainText(item.lastMessagePreview)}
              </span>
              <time
                dateTime={item.lastMessageAt}
                className="shrink-0 text-xs text-muted-foreground"
              >
                {shortDate(item.lastMessageAt, i18n.language)}
              </time>
            </Link>
          </li>
        ))}
      </ul>
      {list.hasNextPage ? (
        <Button
          variant="ghost"
          size="sm"
          className="-ms-2"
          loading={list.isFetchingNextPage}
          onClick={() => void list.fetchNextPage()}
        >
          {t("team-conversations.history.more")}
        </Button>
      ) : null}
    </PanelSection>
  );
}
