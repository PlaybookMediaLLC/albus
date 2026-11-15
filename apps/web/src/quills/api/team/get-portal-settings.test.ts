import { describe } from "vite-plus/test";
import { describeOperationContract } from "../../test/contracts";
import { getPortalSettings } from "./get-portal-settings";
import { getPortalSettingsFixture } from "./get-portal-settings.fixture";
describe("getPortalSettings", () => {
  describeOperationContract({
    operationId: "getQuillsPortalSettings",
    operation: getPortalSettings,
    request: { param: { workspaceId: "workspace_test_1" } },
    response: getPortalSettingsFixture.ok(),
    method: "get",
    path: "/api/quills/workspace_test_1/settings/portal",
    statuses: [401, 403, 429],
  });
});
