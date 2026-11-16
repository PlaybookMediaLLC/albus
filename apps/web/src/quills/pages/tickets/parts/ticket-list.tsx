import { useTranslation } from "react-i18next";
import type { GetMyTicketsResponse } from "../../../api/support/get-my-tickets";
import { portalHref } from "../../../core/portal-href";
import { relativeTime } from "../../../core/relative-time";
import { Badge, cn } from "../../../ui/upstream";

type Ticket = GetMyTicketsResponse["items"][number];
export interface TicketListProps {
  workspaceId: string;
  tickets: Ticket[];
}

/** The customer's tickets as rows. A ticket with a conversation links the whole row to it. */
export function TicketList({ workspaceId, tickets }: TicketListProps) {
  const { t, i18n } = useTranslation("quills");
  return (
    <ul className="-mx-3 grid gap-1">
      {tickets.map((ticket) => {
        const time = ticket.updatedAt ?? ticket.createdAt;
        return (
          <li
            key={ticket.id}
            className={cn(
              "relative rounded-xl px-3 py-2.5",
              ticket.conversationId && "transition-colors hover:bg-muted/60",
            )}
          >
            <div className="flex items-baseline gap-3">
              {ticket.conversationId ? (
                <a
                  href={portalHref(
                    workspaceId,
                    `conversations/${ticket.conversationId}`,
                  )}
                  aria-label={t("tickets.openConversation", {
                    title: ticket.title,
                  })}
                  className="min-w-0 flex-1 truncate font-medium after:absolute after:inset-0 after:rounded-xl focus-visible:outline-none focus-visible:after:ring-2 focus-visible:after:ring-ring"
                >
                  {ticket.title}
                </a>
              ) : (
                <span className="min-w-0 flex-1 truncate font-medium">
                  {ticket.title}
                </span>
              )}
              <Badge
                variant={ticket.resolvedAt ? "success" : "outline"}
                size="sm"
                className="min-w-0 max-w-1/2"
              >
                <span className="truncate">
                  {ticket.stageLabel?.trim() || t("tickets.stageMissing")}
                </span>
              </Badge>
            </div>
            <p className="mt-0.5 flex flex-wrap gap-x-2 text-xs text-muted-foreground">
              <span className="font-mono">
                {t("tickets.reference", { reference: ticket.reference })}
              </span>
              <time dateTime={time}>{relativeTime(time, i18n.language)}</time>
            </p>
          </li>
        );
      })}
    </ul>
  );
}
