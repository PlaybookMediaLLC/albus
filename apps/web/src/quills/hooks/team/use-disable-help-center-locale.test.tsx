import { describe } from "vite-plus/test";
import { describeHookContract } from "../../test/contracts";
import { quillsOperationKey } from "../../api/keys";
import { disableHelpCenterLocaleFixture } from "../../api/team/disable-help-center-locale.fixture";
import { useDisableHelpCenterLocale } from "./use-disable-help-center-locale";
describe("useDisableHelpCenterLocale", () => {
  describeHookContract({
    kind: "mutation",
    hook: useDisableHelpCenterLocale,
    operationId: "disableQuillsHelpCenterLocale",
    request: {
      param: { workspaceId: "workspace_test_1" },
      query: { locale: "en" },
    },
    response: disableHelpCenterLocaleFixture.ok(),
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
