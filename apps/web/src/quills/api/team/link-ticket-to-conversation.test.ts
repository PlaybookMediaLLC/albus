import { describe } from "vite-plus/test";
import { describeOperationContract } from "../../test/contracts";
import { linkTicketToConversation } from "./link-ticket-to-conversation";
import { linkTicketToConversationFixture } from "./link-ticket-to-conversation.fixture";
describe("linkTicketToConversation", () => {
  describeOperationContract({
    operationId: "linkQuillsTicketToConversation",
    operation: linkTicketToConversation,
    request: {
      param: {
        workspaceId: "workspace_test_1",
        ticketId: "ticket-id_test_1",
        conversationId: "conversation-id_test_1",
      },
    },
    response: linkTicketToConversationFixture.ok(),
    method: "put",
    path: "/api/quills/workspace_test_1/tickets/ticket-id_test_1/conversations/conversation-id_test_1",
    statuses: [401, 403, 404, 409, 429],
  });
});
