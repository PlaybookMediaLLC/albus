import { describe } from "vite-plus/test";
import { describeOperationContract } from "../../test/contracts";
import { unarchiveConversation } from "./unarchive-conversation";
import { unarchiveConversationFixture } from "./unarchive-conversation.fixture";
describe("unarchiveConversation", () => {
  describeOperationContract({
    operationId: "unarchiveQuillsConversation",
    operation: unarchiveConversation,
    request: {
      param: {
        workspaceId: "workspace_test_1",
        conversationId: "conversation-id_test_1",
      },
    },
    response: unarchiveConversationFixture.ok(),
    method: "post",
    path: "/api/quills/workspace_test_1/conversations/conversation-id_test_1/unarchive",
    statuses: [401, 403, 404, 409, 429],
  });
});
