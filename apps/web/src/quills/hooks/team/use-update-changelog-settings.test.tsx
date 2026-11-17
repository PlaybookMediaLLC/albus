import { describe } from "vite-plus/test";
import { describeHookContract } from "../../test/contracts";
import { quillsOperationKey } from "../../api/keys";
import { updateChangelogSettingsFixture } from "../../api/team/update-changelog-settings.fixture";
import { useUpdateChangelogSettings } from "./use-update-changelog-settings";
describe("useUpdateChangelogSettings", () => {
  describeHookContract({
    kind: "mutation",
    hook: useUpdateChangelogSettings,
    operationId: "updateQuillsChangelogSettings",
    request: { param: { workspaceId: "workspace_test_1" }, json: {} },
    response: updateChangelogSettingsFixture.ok(),
    viewer: { kind: "anonymous" },
    takesViewer: true,
    invalidates: [
      quillsOperationKey(
        "workspace_test_1",
        { kind: "anonymous" },
        "team",
        "getChangelogSettings",
      ),
    ],
  });
});
