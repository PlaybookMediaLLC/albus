import { describe } from "vite-plus/test";
import { describeOperationContract } from "../../test/contracts";
import { setWorkflowCloseSpam } from "./set-workflow-close-spam";
import { setWorkflowCloseSpamFixture } from "./set-workflow-close-spam.fixture";
describe("setWorkflowCloseSpam", () => {
  describeOperationContract({
    operationId: "setQuillsWorkflowCloseSpam",
    operation: setWorkflowCloseSpam,
    request: {
      param: { workspaceId: "workspace_test_1" },
      json: { enabled: false },
    },
    response: setWorkflowCloseSpamFixture.ok(),
    method: "put",
    path: "/api/quills/workspace_test_1/automation/settings/close-spam",
    statuses: [401, 403, 429],
  });
});
