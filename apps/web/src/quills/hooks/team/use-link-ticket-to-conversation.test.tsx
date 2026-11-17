import { describe } from "vite-plus/test";
import { describeHookContract } from "../../test/contracts";
import { quillsOperationKey } from "../../api/keys";
import { linkTicketToConversationFixture } from "../../api/team/link-ticket-to-conversation.fixture";
import { useLinkTicketToConversation } from "./use-link-ticket-to-conversation";
describe("useLinkTicketToConversation", () => {
  describeHookContract({
    kind: "mutation",
    hook: useLinkTicketToConversation,
    operationId: "linkQuillsTicketToConversation",
    request: {
      param: {
        workspaceId: "workspace_test_1",
        ticketId: "ticket-id_test_1",
        conversationId: "conversation-id_test_1",
      },
    },
    response: linkTicketToConversationFixture.ok(),
    viewer: { kind: "anonymous" },
    takesViewer: true,
    invalidates: [
      quillsOperationKey(
        "workspace_test_1",
        { kind: "anonymous" },
        "team",
        "getConversationTicketLink",
      ),
      quillsOperationKey(
        "workspace_test_1",
        { kind: "anonymous" },
        "team",
        "listConversationMessages",
      ),
    ],
  });
});
