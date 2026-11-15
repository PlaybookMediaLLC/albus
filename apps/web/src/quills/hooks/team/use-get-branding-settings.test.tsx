import { describe } from "vite-plus/test";
import { describeHookContract } from "../../test/contracts";
import { getBrandingSettingsFixture } from "../../api/team/get-branding-settings.fixture";
import { useGetBrandingSettings } from "./use-get-branding-settings";
describe("useGetBrandingSettings", () => {
  describeHookContract({
    kind: "query",
    hook: useGetBrandingSettings,
    operationId: "getQuillsBrandingSettings",
    request: { param: { workspaceId: "workspace_test_1" } },
    emptyRequest: { param: { workspaceId: "" } },
    response: getBrandingSettingsFixture.ok(),
    viewer: { kind: "anonymous" },
    takesViewer: false,
    invalidates: [],
  });
});
