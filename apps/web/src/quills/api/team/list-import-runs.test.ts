import { describe } from "vite-plus/test";
import { describeOperationContract } from "../../test/contracts";
import { listImportRuns } from "./list-import-runs";
import { listImportRunsFixture } from "./list-import-runs.fixture";
describe("listImportRuns", () => {
  describeOperationContract({
    operationId: "listQuillsImportRuns",
    operation: listImportRuns,
    request: { param: { workspaceId: "workspace_test_1" } },
    response: listImportRunsFixture.ok(),
    method: "get",
    path: "/api/quills/workspace_test_1/transfer/import-runs",
    statuses: [401, 403, 429],
  });
});
