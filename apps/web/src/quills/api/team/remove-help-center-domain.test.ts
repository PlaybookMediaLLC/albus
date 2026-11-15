import { describe } from "vite-plus/test";
import { describeOperationContract } from "../../test/contracts";
import { removeHelpCenterDomain } from "./remove-help-center-domain";
import { removeHelpCenterDomainFixture } from "./remove-help-center-domain.fixture";
describe("removeHelpCenterDomain", () => {
  describeOperationContract({
    operationId: "removeQuillsHelpCenterDomain",
    operation: removeHelpCenterDomain,
    request: { param: { workspaceId: "workspace_test_1" } },
    response: removeHelpCenterDomainFixture.ok(),
    method: "delete",
    path: "/api/quills/workspace_test_1/operations/domains/help-center",
    statuses: [401, 403, 429],
  });
});
