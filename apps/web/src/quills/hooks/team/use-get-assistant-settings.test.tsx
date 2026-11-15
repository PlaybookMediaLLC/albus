import { describe } from "vite-plus/test";
import { describeHookContract } from "../../test/contracts";
import { getAssistantSettingsFixture } from "../../api/team/get-assistant-settings.fixture";
import { useGetAssistantSettings } from "./use-get-assistant-settings";
describe("useGetAssistantSettings", () => {
  describeHookContract({
    kind: "query",
    hook: useGetAssistantSettings,
    operationId: "getQuillsAssistantSettings",
    request: { param: { workspaceId: "workspace_test_1" } },
    emptyRequest: { param: { workspaceId: "" } },
    response: getAssistantSettingsFixture.ok(),
    viewer: { kind: "anonymous" },
    takesViewer: false,
    invalidates: [],
  });
});
