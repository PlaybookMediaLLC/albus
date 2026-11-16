import { useTranslation } from "react-i18next";
import { PanelSection } from "../../../ui/inbox/panel-section";
import { LinkedRequests } from "./linked-requests";
import { LinkedTicket } from "./linked-ticket";

export interface LinksSectionProps {
  workspaceId: string;
  conversationId: string;
  visitorPrincipalId: string;
  customerName: string;
  subject: string | null;
}

/** The customer ticket and the requests of a conversation. */
export function LinksSection(props: LinksSectionProps) {
  const { t } = useTranslation("quills");
  return (
    <PanelSection title={t("team-conversations.links.title")}>
      <LinkedTicket
        workspaceId={props.workspaceId}
        conversationId={props.conversationId}
        visitorPrincipalId={props.visitorPrincipalId}
        subject={props.subject}
      />
      <LinkedRequests
        workspaceId={props.workspaceId}
        conversationId={props.conversationId}
        customerName={props.customerName}
        subject={props.subject}
      />
    </PanelSection>
  );
}
