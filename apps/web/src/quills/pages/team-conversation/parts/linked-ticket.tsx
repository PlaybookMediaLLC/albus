import { Link } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import type { PortalProblem } from "../../../core/types";
import { useCreateTicket } from "../../../hooks/team/use-create-ticket";
import { useGetConversationTicketLink } from "../../../hooks/team/use-get-conversation-ticket-link";
import { useLinkTicketToConversation } from "../../../hooks/team/use-link-ticket-to-conversation";
import { useTeamRuntime } from "../../../team/runtime";
import { teamHref } from "../../../team/team-href";
import { PropertyRow } from "../../../ui/inbox/property-row";
import { NameDialog } from "../../../ui/name-dialog";
import { Button, toast } from "../../../ui/upstream";

export interface LinkedTicketProps {
  workspaceId: string;
  conversationId: string;
  /** The customer, who becomes the ticket's requester. */
  visitorPrincipalId: string;
  /** The first title of a new ticket. */
  subject: string | null;
}

const link = "text-primary underline-offset-4 hover:underline";

/**
 * The customer ticket that shares this conversation's thread, or a button that creates one. The
 * create and the link are two requests: when the link fails, the toast names the new ticket.
 */
export function LinkedTicket(props: LinkedTicketProps) {
  const { t } = useTranslation("quills");
  const team = useTeamRuntime();
  const { workspaceId, conversationId } = props;
  const ticket = useGetConversationTicketLink(
    { param: { workspaceId, conversationId } },
    team.viewer,
  ).data?.ticket;
  const create = useCreateTicket(team.viewer);
  const pair = useLinkTicketToConversation(team.viewer);
  const [open, setOpen] = useState(false);
  const submit = async (title: string): Promise<PortalProblem | void> => {
    let created;
    try {
      created = await create.mutateAsync({
        param: { workspaceId },
        json: {
          type: "customer",
          title,
          requesterPrincipalId: props.visitorPrincipalId,
          conversationId,
        },
      });
    } catch (error) {
      return error as PortalProblem;
    }
    setOpen(false);
    try {
      await pair.mutateAsync({
        param: { workspaceId, ticketId: created.id, conversationId },
      });
      toast.success(
        t("team-conversations.links.ticketCreated", {
          reference: created.reference,
        }),
      );
    } catch {
      toast.error(
        t("team-conversations.links.ticketNotLinked", {
          reference: created.reference,
        }),
      );
    }
  };
  return (
    <PropertyRow label={t("team-conversations.links.ticket")}>
      {ticket ? (
        <Link
          to={teamHref(workspaceId, `/tickets/${ticket.id}`)}
          className={link}
        >
          {t("team-conversations.links.ticketName", {
            reference: ticket.reference,
            title: ticket.title,
            status: ticket.status.name,
          })}
        </Link>
      ) : team.permissions.create ? (
        <Button
          variant="ghost"
          size="sm"
          className="-ms-2 text-muted-foreground"
          loading={create.isPending || pair.isPending}
          onClick={() => setOpen(true)}
        >
          <Plus aria-hidden="true" />
          {t("team-conversations.links.createTicket")}
        </Button>
      ) : (
        <span className="text-muted-foreground">
          {t("team-conversations.links.none")}
        </span>
      )}
      <NameDialog
        open={open}
        onOpenChange={setOpen}
        title={t("team-conversations.links.ticketDialog")}
        description={t("team-conversations.links.ticketDescription")}
        label={t("team-conversations.links.ticketTitle")}
        maxLength={300}
        defaultValue={props.subject ?? ""}
        submitKey="team-conversations.links.createTicket"
        onSubmit={submit}
      />
    </PropertyRow>
  );
}
