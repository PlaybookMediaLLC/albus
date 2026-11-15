import { describe } from "vite-plus/test";
import { describeOperationContract } from "../../test/contracts";
import { getHelpCenterSettings } from "./get-help-center-settings";
import { getHelpCenterSettingsFixture } from "./get-help-center-settings.fixture";
describe("getHelpCenterSettings", () => {
  describeOperationContract({
    operationId: "getQuillsHelpCenterSettings",
    operation: getHelpCenterSettings,
    request: { param: { workspaceId: "workspace_test_1" } },
    response: getHelpCenterSettingsFixture.ok(),
    method: "get",
    path: "/api/quills/workspace_test_1/help-center/settings",
    statuses: [401, 403, 429],
  });
});
