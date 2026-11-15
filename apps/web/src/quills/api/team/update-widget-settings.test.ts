import { describe } from "vite-plus/test";
import { describeOperationContract } from "../../test/contracts";
import { updateWidgetSettings } from "./update-widget-settings";
import { updateWidgetSettingsFixture } from "./update-widget-settings.fixture";
describe("updateWidgetSettings", () => {
  describeOperationContract({
    operationId: "updateQuillsWidgetSettings",
    operation: updateWidgetSettings,
    request: { param: { workspaceId: "workspace_test_1" }, json: {} },
    response: updateWidgetSettingsFixture.ok(),
    method: "put",
    path: "/api/quills/workspace_test_1/settings/widget",
    statuses: [401, 403, 429],
  });
});
