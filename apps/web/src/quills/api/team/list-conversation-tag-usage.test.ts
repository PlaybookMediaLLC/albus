import { describe } from "vite-plus/test";
import { describeOperationContract } from "../../test/contracts";
import { listConversationTagUsage } from "./list-conversation-tag-usage";
import { listConversationTagUsageFixture } from "./list-conversation-tag-usage.fixture";
describe("listConversationTagUsage", () => {
  describeOperationContract({
    operationId: "listQuillsConversationTagUsage",
    operation: listConversationTagUsage,
    request: { param: { workspaceId: "workspace_test_1" } },
    response: listConversationTagUsageFixture.ok(),
    method: "get",
    path: "/api/quills/workspace_test_1/conversation-tags/usage",
    statuses: [401, 403, 404, 409, 429],
  });
});
