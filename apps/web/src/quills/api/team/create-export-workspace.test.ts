import { describe } from "vite-plus/test";
import { describeOperationContract } from "../../test/contracts";
import { createExportWorkspace } from "./create-export-workspace";
import { createExportWorkspaceFixture } from "./create-export-workspace.fixture";
describe("createExportWorkspace", () => {
  describeOperationContract({
    operationId: "createQuillsExportWorkspace",
    operation: createExportWorkspace,
    request: {
      param: { workspaceId: "workspace_test_1" },
      json: { kind: "posts" },
    },
    response: createExportWorkspaceFixture.ok(),
    method: "post",
    path: "/api/quills/workspace_test_1/transfer/export-runs",
    statuses: [401, 403, 409, 429],
  });
});
