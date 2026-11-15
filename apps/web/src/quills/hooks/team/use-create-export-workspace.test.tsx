import { describe } from "vite-plus/test";
import { describeHookContract } from "../../test/contracts";
import { quillsOperationKey } from "../../api/keys";
import { createExportWorkspaceFixture } from "../../api/team/create-export-workspace.fixture";
import { useCreateExportWorkspace } from "./use-create-export-workspace";
describe("useCreateExportWorkspace", () => {
  describeHookContract({
    kind: "mutation",
    hook: useCreateExportWorkspace,
    operationId: "createQuillsExportWorkspace",
    request: {
      param: { workspaceId: "workspace_test_1" },
      json: { kind: "posts" },
    },
    response: createExportWorkspaceFixture.ok(),
    viewer: { kind: "anonymous" },
    takesViewer: true,
    invalidates: [
      quillsOperationKey(
        "workspace_test_1",
        { kind: "anonymous" },
        "team",
        "listExportRuns",
      ),
    ],
  });
});
