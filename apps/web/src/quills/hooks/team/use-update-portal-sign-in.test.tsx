import { describe } from "vite-plus/test";
import { describeHookContract } from "../../test/contracts";
import { quillsOperationKey } from "../../api/keys";
import { updatePortalSignInFixture } from "../../api/team/update-portal-sign-in.fixture";
import { useUpdatePortalSignIn } from "./use-update-portal-sign-in";
describe("useUpdatePortalSignIn", () => {
  describeHookContract({
    kind: "mutation",
    hook: useUpdatePortalSignIn,
    operationId: "updateQuillsPortalSignIn",
    request: {
      param: { workspaceId: "workspace_test_1" },
      json: { mode: "kaneo", widgetSignIn: false, ssoUrl: null },
    },
    response: updatePortalSignInFixture.ok(),
    viewer: { kind: "anonymous" },
    takesViewer: true,
    invalidates: [
      quillsOperationKey(
        "workspace_test_1",
        { kind: "anonymous" },
        "team",
        "getPortalSettings",
      ),
    ],
  });
});
