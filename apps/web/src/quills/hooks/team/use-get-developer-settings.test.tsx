import { describe } from "vite-plus/test";
import { describeHookContract } from "../../test/contracts";
import { getDeveloperSettingsFixture } from "../../api/team/get-developer-settings.fixture";
import { useGetDeveloperSettings } from "./use-get-developer-settings";
describe("useGetDeveloperSettings", () => {
  describeHookContract({
    kind: "query",
    hook: useGetDeveloperSettings,
    operationId: "getQuillsDeveloperSettings",
    request: { param: { workspaceId: "workspace_test_1" } },
    emptyRequest: { param: { workspaceId: "" } },
    response: getDeveloperSettingsFixture.ok(),
    viewer: { kind: "anonymous" },
    takesViewer: false,
    invalidates: [],
  });
});
