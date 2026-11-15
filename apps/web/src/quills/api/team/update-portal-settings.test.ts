import { describe } from "vite-plus/test";
import { describeOperationContract } from "../../test/contracts";
import { updatePortalSettings } from "./update-portal-settings";
import { updatePortalSettingsFixture } from "./update-portal-settings.fixture";
describe("updatePortalSettings", () => {
  describeOperationContract({
    operationId: "updateQuillsPortalSettings",
    operation: updatePortalSettings,
    request: { param: { workspaceId: "workspace_test_1" }, json: {} },
    response: updatePortalSettingsFixture.ok(),
    method: "put",
    path: "/api/quills/workspace_test_1/settings/portal",
    statuses: [401, 403, 429],
  });
});
