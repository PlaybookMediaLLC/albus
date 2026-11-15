import { describe } from "vite-plus/test";
import { describeHookContract } from "../../test/contracts";
import { quillsOperationKey } from "../../api/keys";
import { enableHelpCenterLocaleFixture } from "../../api/team/enable-help-center-locale.fixture";
import { useEnableHelpCenterLocale } from "./use-enable-help-center-locale";
describe("useEnableHelpCenterLocale", () => {
  describeHookContract({
    kind: "mutation",
    hook: useEnableHelpCenterLocale,
    operationId: "enableQuillsHelpCenterLocale",
    request: {
      param: { workspaceId: "workspace_test_1" },
      json: {
        locale: "en",
        chrome: {
          homepageTitle: "value",
          homepageDescription: "value",
          searchPlaceholder: "value",
        },
      },
    },
    response: enableHelpCenterLocaleFixture.ok(),
    viewer: { kind: "anonymous" },
    takesViewer: true,
    invalidates: [
      quillsOperationKey(
        "workspace_test_1",
        { kind: "anonymous" },
        "team",
        "getHelpCenterSettings",
      ),
    ],
  });
});
