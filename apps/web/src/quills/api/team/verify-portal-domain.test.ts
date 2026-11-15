import { describe } from "vite-plus/test";
import { describeOperationContract } from "../../test/contracts";
import { verifyPortalDomain } from "./verify-portal-domain";
import { verifyPortalDomainFixture } from "./verify-portal-domain.fixture";
describe("verifyPortalDomain", () => {
  describeOperationContract({
    operationId: "verifyQuillsPortalDomain",
    operation: verifyPortalDomain,
    request: { param: { workspaceId: "workspace_test_1" } },
    response: verifyPortalDomainFixture.ok(),
    method: "post",
    path: "/api/quills/workspace_test_1/operations/domains/portal/verify",
    statuses: [401, 403, 404, 429],
  });
});
