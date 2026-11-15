import { describe } from "vite-plus/test";
import { describeOperationContract } from "../../test/contracts";
import { getDeveloperSettings } from "./get-developer-settings";
import { getDeveloperSettingsFixture } from "./get-developer-settings.fixture";
describe("getDeveloperSettings", () => {
  describeOperationContract({
    operationId: "getQuillsDeveloperSettings",
    operation: getDeveloperSettings,
    request: { param: { workspaceId: "workspace_test_1" } },
    response: getDeveloperSettingsFixture.ok(),
    method: "get",
    path: "/api/quills/workspace_test_1/settings/developer",
    statuses: [401, 403, 429],
  });
});
