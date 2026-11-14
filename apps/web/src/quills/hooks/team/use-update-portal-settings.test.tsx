import { describe } from "vite-plus/test";
import { describeHookContract } from "../../test/contracts";
import { quillsOperationKey } from "../../api/keys";
import { updatePortalSettingsFixture } from "../../api/team/update-portal-settings.fixture";
import { useUpdatePortalSettings } from "./use-update-portal-settings";
describe("useUpdatePortalSettings", () => {
  describeHookContract({
    kind: "mutation",
    hook: useUpdatePortalSettings,
    operationId: "updateQuillsPortalSettings",
    request: { param: { workspaceId: "workspace_test_1" }, json: {} },
    response: updatePortalSettingsFixture.ok(),
    viewer: { kind: "anonymous" },
    takesViewer: true,
    invalidates: [
      quillsOperationKey(
        "workspace_test_1",
        { kind: "anonymous" },
        "team",
        "getPortalSettings",
      ),
    ],
  });
});
