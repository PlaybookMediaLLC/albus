import { describe } from "vite-plus/test";
import { describeOperationContract } from "../../test/contracts";
import { getNotificationPreferences } from "./get-notification-preferences";
import { getNotificationPreferencesFixture } from "./get-notification-preferences.fixture";
describe("getNotificationPreferences", () => {
  describeOperationContract({
    operationId: "getQuillsNotificationPreferences",
    operation: getNotificationPreferences,
    request: { param: { workspaceId: "workspace_test_1" } },
    response: getNotificationPreferencesFixture.ok(),
    method: "get",
    path: "/api/quills/workspace_test_1/notification-preferences",
    statuses: [401, 403, 429],
  });
});
