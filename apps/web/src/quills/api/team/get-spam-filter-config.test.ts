import { describe } from "vite-plus/test";
import { describeOperationContract } from "../../test/contracts";
import { getSpamFilterConfig } from "./get-spam-filter-config";
import { getSpamFilterConfigFixture } from "./get-spam-filter-config.fixture";
describe("getSpamFilterConfig", () => {
  describeOperationContract({
    operationId: "getQuillsSpamFilterConfig",
    operation: getSpamFilterConfig,
    request: { param: { workspaceId: "workspace_test_1" } },
    response: getSpamFilterConfigFixture.ok(),
    method: "get",
    path: "/api/quills/workspace_test_1/support/spam-filter",
    statuses: [401, 403, 429],
  });
});
