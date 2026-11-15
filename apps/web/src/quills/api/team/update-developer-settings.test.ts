import { describe } from "vite-plus/test";
import { describeOperationContract } from "../../test/contracts";
import { updateDeveloperSettings } from "./update-developer-settings";
import { updateDeveloperSettingsFixture } from "./update-developer-settings.fixture";
describe("updateDeveloperSettings", () => {
  describeOperationContract({
    operationId: "updateQuillsDeveloperSettings",
    operation: updateDeveloperSettings,
    request: { param: { workspaceId: "workspace_test_1" }, json: {} },
    response: updateDeveloperSettingsFixture.ok(),
    method: "put",
    path: "/api/quills/workspace_test_1/settings/developer",
    statuses: [401, 403, 429],
  });
});
