import { describe } from "vite-plus/test";
import { describeOperationContract } from "../../test/contracts";
import { removePortalDomain } from "./remove-portal-domain";
import { removePortalDomainFixture } from "./remove-portal-domain.fixture";
describe("removePortalDomain", () => {
  describeOperationContract({
    operationId: "removeQuillsPortalDomain",
    operation: removePortalDomain,
    request: { param: { workspaceId: "workspace_test_1" } },
    response: removePortalDomainFixture.ok(),
    method: "delete",
    path: "/api/quills/workspace_test_1/operations/domains/portal",
    statuses: [401, 403, 429],
  });
});
