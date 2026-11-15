import { describe } from "vite-plus/test";
import { describeHookContract } from "../../test/contracts";
import { quillsOperationKey } from "../../api/keys";
import { setWorkflowAbandonedAutoCloseFixture } from "../../api/team/set-workflow-abandoned-auto-close.fixture";
import { useSetWorkflowAbandonedAutoClose } from "./use-set-workflow-abandoned-auto-close";
describe("useSetWorkflowAbandonedAutoClose", () => {
  describeHookContract({
    kind: "mutation",
    hook: useSetWorkflowAbandonedAutoClose,
    operationId: "setQuillsWorkflowAbandonedAutoClose",
    request: { param: { workspaceId: "workspace_test_1" }, json: {} },
    response: setWorkflowAbandonedAutoCloseFixture.ok(),
    viewer: { kind: "anonymous" },
    takesViewer: true,
    invalidates: [
      quillsOperationKey(
        "workspace_test_1",
        { kind: "anonymous" },
        "team",
        "getWorkflowAbandonedAutoClose",
      ),
    ],
  });
});
