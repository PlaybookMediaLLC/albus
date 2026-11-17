import { describe } from "vite-plus/test";
import { describeOperationContract } from "../../test/contracts";
import { updatePortalSignIn } from "./update-portal-sign-in";
import { updatePortalSignInFixture } from "./update-portal-sign-in.fixture";
describe("updatePortalSignIn", () => {
  describeOperationContract({
    operationId: "updateQuillsPortalSignIn",
    operation: updatePortalSignIn,
    request: {
      param: { workspaceId: "workspace_test_1" },
      json: { mode: "kaneo", widgetSignIn: false, ssoUrl: null },
    },
    response: updatePortalSignInFixture.ok(),
    method: "put",
    path: "/api/quills/workspace_test_1/settings/portal/sign-in",
    statuses: [400, 401, 403, 429],
  });
});
