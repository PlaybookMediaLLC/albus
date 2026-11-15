import { describe } from "vite-plus/test";
import { describeHookContract } from "../../test/contracts";
import { getWorkflowAbandonedAutoCloseFixture } from "../../api/team/get-workflow-abandoned-auto-close.fixture";
import { useGetWorkflowAbandonedAutoClose } from "./use-get-workflow-abandoned-auto-close";
describe("useGetWorkflowAbandonedAutoClose", () => {
  describeHookContract({
    kind: "query",
    hook: useGetWorkflowAbandonedAutoClose,
    operationId: "getQuillsWorkflowAbandonedAutoClose",
    request: { param: { workspaceId: "workspace_test_1" } },
    emptyRequest: { param: { workspaceId: "" } },
    response: getWorkflowAbandonedAutoCloseFixture.ok(),
    viewer: { kind: "anonymous" },
    takesViewer: false,
    invalidates: [],
  });
});
