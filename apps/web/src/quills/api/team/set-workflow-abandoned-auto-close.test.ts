import { describe } from "vite-plus/test";
import { describeOperationContract } from "../../test/contracts";
import { setWorkflowAbandonedAutoClose } from "./set-workflow-abandoned-auto-close";
import { setWorkflowAbandonedAutoCloseFixture } from "./set-workflow-abandoned-auto-close.fixture";
describe("setWorkflowAbandonedAutoClose", () => {
  describeOperationContract({
    operationId: "setQuillsWorkflowAbandonedAutoClose",
    operation: setWorkflowAbandonedAutoClose,
    request: { param: { workspaceId: "workspace_test_1" }, json: {} },
    response: setWorkflowAbandonedAutoCloseFixture.ok(),
    method: "put",
    path: "/api/quills/workspace_test_1/automation/settings/abandoned-auto-close",
    statuses: [401, 403, 429],
  });
});
