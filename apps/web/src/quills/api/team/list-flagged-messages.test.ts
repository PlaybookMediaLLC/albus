import { describe } from "vite-plus/test";
import { describeOperationContract } from "../../test/contracts";
import { listFlaggedMessages } from "./list-flagged-messages";
import { listFlaggedMessagesFixture } from "./list-flagged-messages.fixture";
describe("listFlaggedMessages", () => {
  describeOperationContract({
    operationId: "listQuillsFlaggedMessages",
    operation: listFlaggedMessages,
    request: { param: { workspaceId: "workspace_test_1" } },
    response: listFlaggedMessagesFixture.ok(),
    method: "get",
    path: "/api/quills/workspace_test_1/conversation-messages/flagged",
    statuses: [401, 403, 404, 409, 429],
  });
});
