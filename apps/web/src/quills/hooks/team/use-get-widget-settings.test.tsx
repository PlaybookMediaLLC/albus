import { describe } from "vite-plus/test";
import { describeHookContract } from "../../test/contracts";
import { getWidgetSettingsFixture } from "../../api/team/get-widget-settings.fixture";
import { useGetWidgetSettings } from "./use-get-widget-settings";
describe("useGetWidgetSettings", () => {
  describeHookContract({
    kind: "query",
    hook: useGetWidgetSettings,
    operationId: "getQuillsWidgetSettings",
    request: { param: { workspaceId: "workspace_test_1" } },
    emptyRequest: { param: { workspaceId: "" } },
    response: getWidgetSettingsFixture.ok(),
    viewer: { kind: "anonymous" },
    takesViewer: false,
    invalidates: [],
  });
});
