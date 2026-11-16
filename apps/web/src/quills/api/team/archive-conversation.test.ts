import { describe } from "vite-plus/test";
import { describeOperationContract } from "../../test/contracts";
import { archiveConversation } from "./archive-conversation";
import { archiveConversationFixture } from "./archive-conversation.fixture";
describe("archiveConversation", () => {
  describeOperationContract({
    operationId: "archiveQuillsConversation",
    operation: archiveConversation,
    request: {
      param: {
        workspaceId: "workspace_test_1",
        conversationId: "conversation-id_test_1",
      },
    },
    response: archiveConversationFixture.ok(),
    method: "post",
    path: "/api/quills/workspace_test_1/conversations/conversation-id_test_1/archive",
    statuses: [401, 403, 404, 409, 429],
  });
});
