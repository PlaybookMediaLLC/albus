import { describe } from "vite-plus/test";
import { describeHookContract } from "../../test/contracts";
import { getHelpCenterSettingsFixture } from "../../api/team/get-help-center-settings.fixture";
import { useGetHelpCenterSettings } from "./use-get-help-center-settings";
describe("useGetHelpCenterSettings", () => {
  describeHookContract({
    kind: "query",
    hook: useGetHelpCenterSettings,
    operationId: "getQuillsHelpCenterSettings",
    request: { param: { workspaceId: "workspace_test_1" } },
    emptyRequest: { param: { workspaceId: "" } },
    response: getHelpCenterSettingsFixture.ok(),
    viewer: { kind: "anonymous" },
    takesViewer: false,
    invalidates: [],
  });
});
