import { describe } from "vite-plus/test";
import { describeOperationContract } from "../../test/contracts";
import { listSettings } from "./list-settings";
import { listSettingsFixture } from "./list-settings.fixture";
describe("listSettings", () => {
  describeOperationContract({
    operationId: "listQuillsSettings",
    operation: listSettings,
    request: { param: { workspaceId: "workspace_test_1" } },
    response: listSettingsFixture.ok(),
    method: "get",
    path: "/api/quills/workspace_test_1/settings",
    statuses: [401, 403, 429],
  });
});
