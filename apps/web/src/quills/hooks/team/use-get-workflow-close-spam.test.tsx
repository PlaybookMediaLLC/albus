import { describe } from "vite-plus/test";
import { describeHookContract } from "../../test/contracts";
import { getWorkflowCloseSpamFixture } from "../../api/team/get-workflow-close-spam.fixture";
import { useGetWorkflowCloseSpam } from "./use-get-workflow-close-spam";
describe("useGetWorkflowCloseSpam", () => {
  describeHookContract({
    kind: "query",
    hook: useGetWorkflowCloseSpam,
    operationId: "getQuillsWorkflowCloseSpam",
    request: { param: { workspaceId: "workspace_test_1" } },
    emptyRequest: { param: { workspaceId: "" } },
    response: getWorkflowCloseSpamFixture.ok(),
    viewer: { kind: "anonymous" },
    takesViewer: false,
    invalidates: [],
  });
});
