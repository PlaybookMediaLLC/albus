import { describe } from "vite-plus/test";
import { describeOperationContract } from "../../test/contracts";
import { blockConversationIp } from "./block-conversation-ip";
import { blockConversationIpFixture } from "./block-conversation-ip.fixture";
describe("blockConversationIp", () => {
  describeOperationContract({
    operationId: "blockQuillsConversationIp",
    operation: blockConversationIp,
    request: {
      param: {
        workspaceId: "workspace_test_1",
        conversationId: "conversation-id_test_1",
      },
    },
    response: blockConversationIpFixture.ok(),
    method: "put",
    path: "/api/quills/workspace_test_1/conversations/conversation-id_test_1/ip-block",
    statuses: [401, 403, 404, 409, 429],
  });
});
