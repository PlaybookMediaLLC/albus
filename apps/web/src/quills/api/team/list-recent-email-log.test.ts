import { describe } from "vite-plus/test";
import { describeOperationContract } from "../../test/contracts";
import { listRecentEmailLog } from "./list-recent-email-log";
import { listRecentEmailLogFixture } from "./list-recent-email-log.fixture";
describe("listRecentEmailLog", () => {
  describeOperationContract({
    operationId: "listQuillsRecentEmailLog",
    operation: listRecentEmailLog,
    request: { param: { workspaceId: "workspace_test_1" } },
    response: listRecentEmailLogFixture.ok(),
    method: "get",
    path: "/api/quills/workspace_test_1/support/email-log",
    statuses: [401, 403, 429],
  });
});
