import { describe } from "vite-plus/test";
import { describeOperationContract } from "../../test/contracts";
import { updateSpamFilterConfig } from "./update-spam-filter-config";
import { updateSpamFilterConfigFixture } from "./update-spam-filter-config.fixture";
describe("updateSpamFilterConfig", () => {
  describeOperationContract({
    operationId: "updateQuillsSpamFilterConfig",
    operation: updateSpamFilterConfig,
    request: { param: { workspaceId: "workspace_test_1" }, json: {} },
    response: updateSpamFilterConfigFixture.ok(),
    method: "patch",
    path: "/api/quills/workspace_test_1/support/spam-filter",
    statuses: [401, 403, 429],
  });
});
