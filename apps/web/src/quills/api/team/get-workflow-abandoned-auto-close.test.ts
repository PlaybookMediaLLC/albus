import { describe } from "vite-plus/test";
import { describeOperationContract } from "../../test/contracts";
import { getWorkflowAbandonedAutoClose } from "./get-workflow-abandoned-auto-close";
import { getWorkflowAbandonedAutoCloseFixture } from "./get-workflow-abandoned-auto-close.fixture";
describe("getWorkflowAbandonedAutoClose", () => {
  describeOperationContract({
    operationId: "getQuillsWorkflowAbandonedAutoClose",
    operation: getWorkflowAbandonedAutoClose,
    request: { param: { workspaceId: "workspace_test_1" } },
    response: getWorkflowAbandonedAutoCloseFixture.ok(),
    method: "get",
    path: "/api/quills/workspace_test_1/automation/settings/abandoned-auto-close",
    statuses: [401, 403, 429],
  });
});
