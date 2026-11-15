import { describe } from "vite-plus/test";
import { describeOperationContract } from "../../test/contracts";
import { listPendingModeration } from "./list-pending-moderation";
import { listPendingModerationFixture } from "./list-pending-moderation.fixture";
describe("listPendingModeration", () => {
  describeOperationContract({
    operationId: "listQuillsPendingModeration",
    operation: listPendingModeration,
    request: { param: { workspaceId: "workspace_test_1" } },
    response: listPendingModerationFixture.ok(),
    method: "get",
    path: "/api/quills/workspace_test_1/moderation/pending",
    statuses: [401, 403, 429],
  });
});
