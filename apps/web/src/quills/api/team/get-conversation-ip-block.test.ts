import { describe } from "vite-plus/test";
import { describeOperationContract } from "../../test/contracts";
import { getConversationIpBlock } from "./get-conversation-ip-block";
import { getConversationIpBlockFixture } from "./get-conversation-ip-block.fixture";
describe("getConversationIpBlock", () => {
  describeOperationContract({
    operationId: "getQuillsConversationIpBlock",
    operation: getConversationIpBlock,
    request: {
      param: {
        workspaceId: "workspace_test_1",
        conversationId: "conversation-id_test_1",
      },
    },
    response: getConversationIpBlockFixture.ok(),
    method: "get",
    path: "/api/quills/workspace_test_1/conversations/conversation-id_test_1/ip-block",
    statuses: [401, 403, 404, 409, 429],
  });
});
