import { describe } from "vite-plus/test";
import { describeOperationContract } from "../../test/contracts";
import { listExportRuns } from "./list-export-runs";
import { listExportRunsFixture } from "./list-export-runs.fixture";
describe("listExportRuns", () => {
  describeOperationContract({
    operationId: "listQuillsExportRuns",
    operation: listExportRuns,
    request: { param: { workspaceId: "workspace_test_1" } },
    response: listExportRunsFixture.ok(),
    method: "get",
    path: "/api/quills/workspace_test_1/transfer/export-runs",
    statuses: [401, 403, 429],
  });
});
