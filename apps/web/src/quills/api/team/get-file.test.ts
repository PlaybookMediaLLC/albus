import { describe } from "vite-plus/test";
import { describeOperationContract } from "../../test/contracts";
import { getFile } from "./get-file";
import { getFileFixture } from "./get-file.fixture";
describe("getFile", () => {
  describeOperationContract({
    operationId: "getQuillsFile",
    operation: getFile,
    request: {
      param: { workspaceId: "workspace_test_1", fileId: "file-id_test_1" },
    },
    response: getFileFixture.ok(),
    method: "get",
    path: "/api/quills/workspace_test_1/files/file-id_test_1",
    statuses: [401, 403, 404, 429],
  });
});
