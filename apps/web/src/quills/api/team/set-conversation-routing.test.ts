import { describe } from "vite-plus/test";
import { describeOperationContract } from "../../test/contracts";
import { setConversationRouting } from "./set-conversation-routing";
import { setConversationRoutingFixture } from "./set-conversation-routing.fixture";
describe("setConversationRouting", () => {
  describeOperationContract({
    operationId: "setQuillsConversationRouting",
    operation: setConversationRouting,
    request: {
      param: { workspaceId: "workspace_test_1" },
      json: { enabled: false, strategy: "auto_assign_active" },
    },
    response: setConversationRoutingFixture.ok(),
    method: "put",
    path: "/api/quills/workspace_test_1/support/routing",
    statuses: [401, 403, 429],
  });
});
