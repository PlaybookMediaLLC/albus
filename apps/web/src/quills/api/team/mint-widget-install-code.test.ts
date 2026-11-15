import { describe } from "vite-plus/test";
import { describeOperationContract } from "../../test/contracts";
import { mintWidgetInstallCode } from "./mint-widget-install-code";
import { mintWidgetInstallCodeFixture } from "./mint-widget-install-code.fixture";
describe("mintWidgetInstallCode", () => {
  describeOperationContract({
    operationId: "mintQuillsWidgetInstallCode",
    operation: mintWidgetInstallCode,
    request: { param: { workspaceId: "workspace_test_1" } },
    response: mintWidgetInstallCodeFixture.ok(),
    method: "post",
    path: "/api/quills/workspace_test_1/settings/widget/install-code",
    statuses: [401, 403, 429],
  });
});
