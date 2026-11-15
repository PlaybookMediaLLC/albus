import { describe } from "vite-plus/test";
import { describeHookContract } from "../../test/contracts";
import { getNotificationPreferencesFixture } from "../../api/team/get-notification-preferences.fixture";
import { useGetNotificationPreferences } from "./use-get-notification-preferences";
describe("useGetNotificationPreferences", () => {
  describeHookContract({
    kind: "query",
    hook: useGetNotificationPreferences,
    operationId: "getQuillsNotificationPreferences",
    request: { param: { workspaceId: "workspace_test_1" } },
    emptyRequest: { param: { workspaceId: "" } },
    response: getNotificationPreferencesFixture.ok(),
    viewer: { kind: "anonymous" },
    takesViewer: false,
    invalidates: [],
  });
});
