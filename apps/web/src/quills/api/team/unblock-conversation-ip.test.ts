import { describe } from "vite-plus/test";
import { describeOperationContract } from "../../test/contracts";
import { unblockConversationIp } from "./unblock-conversation-ip";
import { unblockConversationIpFixture } from "./unblock-conversation-ip.fixture";
describe("unblockConversationIp", () => {
  describeOperationContract({
    operationId: "unblockQuillsConversationIp",
    operation: unblockConversationIp,
    request: {
      param: {
        workspaceId: "workspace_test_1",
        conversationId: "conversation-id_test_1",
      },
    },
    response: unblockConversationIpFixture.ok(),
    method: "delete",
    path: "/api/quills/workspace_test_1/conversations/conversation-id_test_1/ip-block",
    statuses: [401, 403, 404, 409, 429],
  });
});
