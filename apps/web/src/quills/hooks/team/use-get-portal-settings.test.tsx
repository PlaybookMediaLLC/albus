import { describe } from "vite-plus/test";
import { describeHookContract } from "../../test/contracts";
import { getPortalSettingsFixture } from "../../api/team/get-portal-settings.fixture";
import { useGetPortalSettings } from "./use-get-portal-settings";
describe("useGetPortalSettings", () => {
  describeHookContract({
    kind: "query",
    hook: useGetPortalSettings,
    operationId: "getQuillsPortalSettings",
    request: { param: { workspaceId: "workspace_test_1" } },
    emptyRequest: { param: { workspaceId: "" } },
    response: getPortalSettingsFixture.ok(),
    viewer: { kind: "anonymous" },
    takesViewer: false,
    invalidates: [],
  });
});
