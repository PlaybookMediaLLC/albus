import { describe } from "vite-plus/test";
import { describeHookContract } from "../../test/contracts";
import { quillsOperationKey } from "../../api/keys";
import { createImportFixture } from "../../api/team/create-import.fixture";
import { useCreateImport } from "./use-create-import";
describe("useCreateImport", () => {
  describeHookContract({
    kind: "mutation",
    hook: useCreateImport,
    operationId: "createQuillsImport",
    request: {
      param: { workspaceId: "workspace_test_1" },
      json: {
        key: "value",
        contentType: "value",
        size: 0,
        name: "value",
        boardId: "board_id_test_1",
      },
    },
    response: createImportFixture.ok(),
    viewer: { kind: "anonymous" },
    takesViewer: true,
    invalidates: [
      quillsOperationKey(
        "workspace_test_1",
        { kind: "anonymous" },
        "team",
        "listImportRuns",
      ),
    ],
  });
});
