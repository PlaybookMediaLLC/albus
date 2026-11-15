import { describe } from "vite-plus/test";
import { describeHookContract } from "../../test/contracts";
import { quillsOperationKey } from "../../api/keys";
import { updateNotificationPreferencesFixture } from "../../api/team/update-notification-preferences.fixture";
import { useUpdateNotificationPreferences } from "./use-update-notification-preferences";
describe("useUpdateNotificationPreferences", () => {
  describeHookContract({
    kind: "mutation",
    hook: useUpdateNotificationPreferences,
    operationId: "updateQuillsNotificationPreferences",
    request: {
      param: { workspaceId: "workspace_test_1" },
      json: { matrix: [{ type: "comment_created", email: false }] },
    },
    response: updateNotificationPreferencesFixture.ok(),
    viewer: { kind: "anonymous" },
    takesViewer: true,
    invalidates: [
      quillsOperationKey(
        "workspace_test_1",
        { kind: "anonymous" },
        "team",
        "getNotificationPreferences",
      ),
    ],
  });
});
