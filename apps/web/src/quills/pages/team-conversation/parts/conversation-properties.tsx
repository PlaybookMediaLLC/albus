import { useTranslation } from "react-i18next";
import type { GetConversationResponse } from "../../../api/team/get-conversation";
import { ConversationSection } from "./conversation-section";
import { CustomerIdentity } from "./customer-identity";
import { CustomerSection } from "./customer-section";
import { LinksSection } from "./links-section";
import { PreviousConversations } from "./previous-conversations";
import { SummarySection } from "./summary-section";

export interface ConversationPropertiesProps {
  workspaceId: string;
  conversation: GetConversationResponse;
}

/**
 * The right panel (design section 2): who the customer is, then the conversation's properties,
 * its AI summary, its links, the customer's details and their other conversations. The header
 * holds the status and the assignee. The API has no email security checks (SPF, DKIM, DMARC),
 * so the panel has no such section.
 */
export function ConversationProperties({
  workspaceId,
  conversation,
}: ConversationPropertiesProps) {
  const { t } = useTranslation("quills");
  const customerName =
    conversation.visitorName ??
    conversation.visitorEmail ??
    t("team-conversations.unknown");
  return (
    <div className="grid gap-3">
      <CustomerIdentity
        workspaceId={workspaceId}
        principalId={conversation.visitorPrincipalId}
        name={conversation.visitorName}
        email={conversation.visitorEmail}
      />
      <ConversationSection
        workspaceId={workspaceId}
        conversation={conversation}
      />
      <SummarySection
        workspaceId={workspaceId}
        conversationId={conversation.id}
        summary={conversation.summary}
        summaryUpdatedAt={conversation.summaryUpdatedAt}
      />
      <LinksSection
        workspaceId={workspaceId}
        conversationId={conversation.id}
        visitorPrincipalId={conversation.visitorPrincipalId}
        customerName={customerName}
        subject={conversation.subject}
      />
      <CustomerSection
        workspaceId={workspaceId}
        principalId={conversation.visitorPrincipalId}
      />
      <PreviousConversations
        workspaceId={workspaceId}
        conversationId={conversation.id}
        visitorPrincipalId={conversation.visitorPrincipalId}
      />
    </div>
  );
}
