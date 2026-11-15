import { describe } from "vite-plus/test";
import { describeOperationContract } from "../../test/contracts";
import { verifyHelpCenterDomain } from "./verify-help-center-domain";
import { verifyHelpCenterDomainFixture } from "./verify-help-center-domain.fixture";
describe("verifyHelpCenterDomain", () => {
  describeOperationContract({
    operationId: "verifyQuillsHelpCenterDomain",
    operation: verifyHelpCenterDomain,
    request: { param: { workspaceId: "workspace_test_1" } },
    response: verifyHelpCenterDomainFixture.ok(),
    method: "post",
    path: "/api/quills/workspace_test_1/operations/domains/help-center/verify",
    statuses: [401, 403, 404, 429],
  });
});
