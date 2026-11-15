import { describe } from "vite-plus/test";
import { describeHookContract } from "../../test/contracts";
import { quillsOperationKey } from "../../api/keys";
import { updateBrandingSettingsFixture } from "../../api/team/update-branding-settings.fixture";
import { useUpdateBrandingSettings } from "./use-update-branding-settings";
describe("useUpdateBrandingSettings", () => {
  describeHookContract({
    kind: "mutation",
    hook: useUpdateBrandingSettings,
    operationId: "updateQuillsBrandingSettings",
    request: { param: { workspaceId: "workspace_test_1" }, json: {} },
    response: updateBrandingSettingsFixture.ok(),
    viewer: { kind: "anonymous" },
    takesViewer: true,
    invalidates: [
      quillsOperationKey(
        "workspace_test_1",
        { kind: "anonymous" },
        "team",
        "getBrandingSettings",
      ),
    ],
  });
});
