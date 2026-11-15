import { describe } from "vite-plus/test";
import { describeOperationContract } from "../../test/contracts";
import { getBrandingSettings } from "./get-branding-settings";
import { getBrandingSettingsFixture } from "./get-branding-settings.fixture";
describe("getBrandingSettings", () => {
  describeOperationContract({
    operationId: "getQuillsBrandingSettings",
    operation: getBrandingSettings,
    request: { param: { workspaceId: "workspace_test_1" } },
    response: getBrandingSettingsFixture.ok(),
    method: "get",
    path: "/api/quills/workspace_test_1/settings/branding",
    statuses: [401, 403, 429],
  });
});
