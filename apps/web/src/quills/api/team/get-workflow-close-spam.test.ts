import { describe } from "vite-plus/test";
import { describeOperationContract } from "../../test/contracts";
import { getWorkflowCloseSpam } from "./get-workflow-close-spam";
import { getWorkflowCloseSpamFixture } from "./get-workflow-close-spam.fixture";
describe("getWorkflowCloseSpam", () => {
  describeOperationContract({
    operationId: "getQuillsWorkflowCloseSpam",
    operation: getWorkflowCloseSpam,
    request: { param: { workspaceId: "workspace_test_1" } },
    response: getWorkflowCloseSpamFixture.ok(),
    method: "get",
    path: "/api/quills/workspace_test_1/automation/settings/close-spam",
    statuses: [401, 403, 429],
  });
});
