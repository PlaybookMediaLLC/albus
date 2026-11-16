import { useTranslation } from "react-i18next";
import type { ListMyConversationsResponse } from "../../../api/support/list-my-conversations";
import { portalHref } from "../../../core/portal-href";
import { relativeTime } from "../../../core/relative-time";
import { Badge } from "../../../ui/upstream";

type Conversation = ListMyConversationsResponse["items"][number];
export interface ConversationListProps {
  workspaceId: string;
  conversations: Conversation[];
}

/** The customer's conversations as rows. The subject link covers the whole row. */
export function ConversationList({
  workspaceId,
  conversations,
}: ConversationListProps) {
  const { t, i18n } = useTranslation("quills");
  return (
    <ul className="portal-conversation-list -mx-3 my-5 grid gap-1">
      {conversations.map((conversation) => {
        const subject =
          conversation.subject?.trim() || t("support.subjectMissing");
        const time = conversation.lastMessageAt ?? conversation.createdAt;
        return (
          <li
            key={conversation.id}
            className="relative rounded-xl px-3 py-2.5 transition-colors hover:bg-muted/60"
          >
            <div className="flex items-baseline gap-3">
              <a
                href={portalHref(
                  workspaceId,
                  `conversations/${conversation.id}`,
                )}
                aria-label={t("support.openConversation", { subject })}
                className="min-w-0 flex-1 truncate font-medium after:absolute after:inset-0 after:rounded-xl focus-visible:outline-none focus-visible:after:ring-2 focus-visible:after:ring-ring"
              >
                {subject}
              </a>
              {conversation.unreadCount ? (
                <Badge variant="info" size="sm">
                  {t("support.unread", { count: conversation.unreadCount })}
                </Badge>
              ) : null}
              <time
                dateTime={time}
                className="shrink-0 text-xs text-muted-foreground"
              >
                {relativeTime(time, i18n.language)}
              </time>
            </div>
            <p className="mt-0.5 truncate text-sm text-muted-foreground">
              {conversation.preview?.trim() || t("support.previewMissing")}
            </p>
          </li>
        );
      })}
    </ul>
  );
}
