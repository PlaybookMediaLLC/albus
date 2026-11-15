import { describe } from "vite-plus/test";
import { describeOperationContract } from "../../test/contracts";
import { getAssistantSettings } from "./get-assistant-settings";
import { getAssistantSettingsFixture } from "./get-assistant-settings.fixture";
describe("getAssistantSettings", () => {
  describeOperationContract({
    operationId: "getQuillsAssistantSettings",
    operation: getAssistantSettings,
    request: { param: { workspaceId: "workspace_test_1" } },
    response: getAssistantSettingsFixture.ok(),
    method: "get",
    path: "/api/quills/workspace_test_1/assistant/settings",
    statuses: [401, 403, 429],
  });
});
