import { describe } from "vite-plus/test";
import { describeOperationContract } from "../../test/contracts";
import { updateChangelogSettings } from "./update-changelog-settings";
import { updateChangelogSettingsFixture } from "./update-changelog-settings.fixture";
describe("updateChangelogSettings", () => {
  describeOperationContract({
    operationId: "updateQuillsChangelogSettings",
    operation: updateChangelogSettings,
    request: { param: { workspaceId: "workspace_test_1" }, json: {} },
    response: updateChangelogSettingsFixture.ok(),
    method: "patch",
    path: "/api/quills/workspace_test_1/changelog/settings",
    statuses: [401, 403, 409, 429],
  });
});
