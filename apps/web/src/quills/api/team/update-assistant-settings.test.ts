import { describe } from "vite-plus/test";
import { describeOperationContract } from "../../test/contracts";
import { updateAssistantSettings } from "./update-assistant-settings";
import { updateAssistantSettingsFixture } from "./update-assistant-settings.fixture";
describe("updateAssistantSettings", () => {
  describeOperationContract({
    operationId: "updateQuillsAssistantSettings",
    operation: updateAssistantSettings,
    request: {
      param: { workspaceId: "workspace_test_1" },
      json: { revision: 1 },
    },
    response: updateAssistantSettingsFixture.ok(),
    method: "patch",
    path: "/api/quills/workspace_test_1/assistant/settings",
    statuses: [401, 403, 409, 429],
  });
});
