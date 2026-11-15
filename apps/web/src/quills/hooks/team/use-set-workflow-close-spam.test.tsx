import { describe } from "vite-plus/test";
import { describeHookContract } from "../../test/contracts";
import { quillsOperationKey } from "../../api/keys";
import { setWorkflowCloseSpamFixture } from "../../api/team/set-workflow-close-spam.fixture";
import { useSetWorkflowCloseSpam } from "./use-set-workflow-close-spam";
describe("useSetWorkflowCloseSpam", () => {
  describeHookContract({
    kind: "mutation",
    hook: useSetWorkflowCloseSpam,
    operationId: "setQuillsWorkflowCloseSpam",
    request: {
      param: { workspaceId: "workspace_test_1" },
      json: { enabled: false },
    },
    response: setWorkflowCloseSpamFixture.ok(),
    viewer: { kind: "anonymous" },
    takesViewer: true,
    invalidates: [
      quillsOperationKey(
        "workspace_test_1",
        { kind: "anonymous" },
        "team",
        "getWorkflowCloseSpam",
      ),
    ],
  });
});
