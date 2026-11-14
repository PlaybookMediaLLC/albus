import { describe } from "vite-plus/test";
import { describeOperationContract } from "../../test/contracts";
import { getWidgetSettings } from "./get-widget-settings";
import { getWidgetSettingsFixture } from "./get-widget-settings.fixture";
describe("getWidgetSettings", () => {
  describeOperationContract({
    operationId: "getQuillsWidgetSettings",
    operation: getWidgetSettings,
    request: { param: { workspaceId: "workspace_test_1" } },
    response: getWidgetSettingsFixture.ok(),
    method: "get",
    path: "/api/quills/workspace_test_1/settings/widget",
    statuses: [401, 403, 429],
  });
});
