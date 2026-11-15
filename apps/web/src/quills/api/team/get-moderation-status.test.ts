import { describe } from "vite-plus/test";
import { describeOperationContract } from "../../test/contracts";
import { getModerationStatus } from "./get-moderation-status";
import { getModerationStatusFixture } from "./get-moderation-status.fixture";
describe("getModerationStatus", () => {
  describeOperationContract({
    operationId: "getQuillsModerationStatus",
    operation: getModerationStatus,
    request: { param: { workspaceId: "workspace_test_1" } },
    response: getModerationStatusFixture.ok(),
    method: "get",
    path: "/api/quills/workspace_test_1/moderation/status",
    statuses: [401, 403, 429],
  });
});
