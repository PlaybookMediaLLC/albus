import { describe } from "vite-plus/test";
import { describeOperationContract } from "../../test/contracts";
import { getChangelogSettings } from "./get-changelog-settings";
import { getChangelogSettingsFixture } from "./get-changelog-settings.fixture";
describe("getChangelogSettings", () => {
  describeOperationContract({
    operationId: "getQuillsChangelogSettings",
    operation: getChangelogSettings,
    request: { param: { workspaceId: "workspace_test_1" } },
    response: getChangelogSettingsFixture.ok(),
    method: "get",
    path: "/api/quills/workspace_test_1/changelog/settings",
    statuses: [401, 403, 429],
  });
});
