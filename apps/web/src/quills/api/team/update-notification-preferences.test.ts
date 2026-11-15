import { describe } from "vite-plus/test";
import { describeOperationContract } from "../../test/contracts";
import { updateNotificationPreferences } from "./update-notification-preferences";
import { updateNotificationPreferencesFixture } from "./update-notification-preferences.fixture";
describe("updateNotificationPreferences", () => {
  describeOperationContract({
    operationId: "updateQuillsNotificationPreferences",
    operation: updateNotificationPreferences,
    request: {
      param: { workspaceId: "workspace_test_1" },
      json: { matrix: [{ type: "comment_created", email: false }] },
    },
    response: updateNotificationPreferencesFixture.ok(),
    method: "patch",
    path: "/api/quills/workspace_test_1/notification-preferences",
    statuses: [401, 403, 429],
  });
});
