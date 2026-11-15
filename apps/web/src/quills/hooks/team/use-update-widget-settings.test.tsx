import { describe } from "vite-plus/test";
import { describeHookContract } from "../../test/contracts";
import { quillsOperationKey } from "../../api/keys";
import { updateWidgetSettingsFixture } from "../../api/team/update-widget-settings.fixture";
import { useUpdateWidgetSettings } from "./use-update-widget-settings";
describe("useUpdateWidgetSettings", () => {
  describeHookContract({
    kind: "mutation",
    hook: useUpdateWidgetSettings,
    operationId: "updateQuillsWidgetSettings",
    request: { param: { workspaceId: "workspace_test_1" }, json: {} },
    response: updateWidgetSettingsFixture.ok(),
    viewer: { kind: "anonymous" },
    takesViewer: true,
    invalidates: [
      quillsOperationKey(
        "workspace_test_1",
        { kind: "anonymous" },
        "team",
        "getWidgetSettings",
      ),
    ],
  });
});
