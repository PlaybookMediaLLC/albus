import { describe } from "vite-plus/test";
import { describeOperationContract } from "../../test/contracts";
import { updateBrandingSettings } from "./update-branding-settings";
import { updateBrandingSettingsFixture } from "./update-branding-settings.fixture";
describe("updateBrandingSettings", () => {
  describeOperationContract({
    operationId: "updateQuillsBrandingSettings",
    operation: updateBrandingSettings,
    request: { param: { workspaceId: "workspace_test_1" }, json: {} },
    response: updateBrandingSettingsFixture.ok(),
    method: "put",
    path: "/api/quills/workspace_test_1/settings/branding",
    statuses: [401, 403, 429],
  });
});
