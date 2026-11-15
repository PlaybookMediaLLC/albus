import { describe } from "vite-plus/test";
import { describeHookContract } from "../../test/contracts";
import { quillsOperationKey } from "../../api/keys";
import { updateDeveloperSettingsFixture } from "../../api/team/update-developer-settings.fixture";
import { useUpdateDeveloperSettings } from "./use-update-developer-settings";
describe("useUpdateDeveloperSettings", () => {
  describeHookContract({
    kind: "mutation",
    hook: useUpdateDeveloperSettings,
    operationId: "updateQuillsDeveloperSettings",
    request: { param: { workspaceId: "workspace_test_1" }, json: {} },
    response: updateDeveloperSettingsFixture.ok(),
    viewer: { kind: "anonymous" },
    takesViewer: true,
    invalidates: [
      quillsOperationKey(
        "workspace_test_1",
        { kind: "anonymous" },
        "team",
        "getDeveloperSettings",
      ),
    ],
  });
});
