import { describe } from "vite-plus/test";
import { describeOperationContract } from "../../test/contracts";
import { getConversationRouting } from "./get-conversation-routing";
import { getConversationRoutingFixture } from "./get-conversation-routing.fixture";
describe("getConversationRouting", () => {
  describeOperationContract({
    operationId: "getQuillsConversationRouting",
    operation: getConversationRouting,
    request: { param: { workspaceId: "workspace_test_1" } },
    response: getConversationRoutingFixture.ok(),
    method: "get",
    path: "/api/quills/workspace_test_1/support/routing",
    statuses: [401, 403, 429],
  });
});
