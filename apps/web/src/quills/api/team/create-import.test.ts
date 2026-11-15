import { describe } from "vite-plus/test";
import { describeOperationContract } from "../../test/contracts";
import { createImport } from "./create-import";
import { createImportFixture } from "./create-import.fixture";
describe("createImport", () => {
  describeOperationContract({
    operationId: "createQuillsImport",
    operation: createImport,
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
    method: "post",
    path: "/api/quills/workspace_test_1/transfer/import-runs",
    statuses: [401, 403, 404, 409, 429],
  });
});
