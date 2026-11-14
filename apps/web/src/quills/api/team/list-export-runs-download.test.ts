import { describe } from "vite-plus/test";
import { describeOperationContract } from "../../test/contracts";
import { listExportRunsDownload } from "./list-export-runs-download";
import { listExportRunsDownloadFixture } from "./list-export-runs-download.fixture";
describe("listExportRunsDownload", () => {
  describeOperationContract({
    operationId: "listQuillsExportRunsDownload",
    operation: listExportRunsDownload,
    request: {
      param: { workspaceId: "workspace_test_1", runId: "run-id_test_1" },
    },
    response: listExportRunsDownloadFixture.ok(),
    method: "get",
    path: "/api/quills/workspace_test_1/transfer/export-runs/run-id_test_1/download",
    statuses: [401, 403, 404, 409, 429],
  });
});
