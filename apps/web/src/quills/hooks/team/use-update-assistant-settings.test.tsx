import { describe } from "vite-plus/test";
import { describeHookContract } from "../../test/contracts";
import { quillsOperationKey } from "../../api/keys";
import { updateAssistantSettingsFixture } from "../../api/team/update-assistant-settings.fixture";
import { useUpdateAssistantSettings } from "./use-update-assistant-settings";
describe("useUpdateAssistantSettings", () => {
  describeHookContract({
    kind: "mutation",
    hook: useUpdateAssistantSettings,
    operationId: "updateQuillsAssistantSettings",
    request: {
      param: { workspaceId: "workspace_test_1" },
      json: { revision: 1 },
    },
    response: updateAssistantSettingsFixture.ok(),
    viewer: { kind: "anonymous" },
    takesViewer: true,
    invalidates: [
      quillsOperationKey(
        "workspace_test_1",
        { kind: "anonymous" },
        "team",
        "getAssistantSettings",
      ),
    ],
  });
});
