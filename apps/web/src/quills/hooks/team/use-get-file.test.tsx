import { describe } from "vite-plus/test";
import { describeHookContract } from "../../test/contracts";
import { getFileFixture } from "../../api/team/get-file.fixture";
import { useGetFile } from "./use-get-file";
describe("useGetFile", () => {
  describeHookContract({
    kind: "query",
    hook: useGetFile,
    operationId: "getQuillsFile",
    request: {
      param: { workspaceId: "workspace_test_1", fileId: "file-id_test_1" },
    },
    emptyRequest: { param: { workspaceId: "", fileId: "file-id_test_1" } },
    response: getFileFixture.ok(),
    viewer: { kind: "anonymous" },
    takesViewer: false,
    invalidates: [],
  });
});
