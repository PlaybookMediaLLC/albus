import { describe } from "vite-plus/test";
import { describeOperationContract } from "../../test/contracts";
import { setHelpCenterDomain } from "./set-help-center-domain";
import { setHelpCenterDomainFixture } from "./set-help-center-domain.fixture";
describe("setHelpCenterDomain", () => {
  describeOperationContract({
    operationId: "setQuillsHelpCenterDomain",
    operation: setHelpCenterDomain,
    request: {
      param: { workspaceId: "workspace_test_1" },
      json: { domain: "value" },
    },
    response: setHelpCenterDomainFixture.ok(),
    method: "put",
    path: "/api/quills/workspace_test_1/operations/domains/help-center",
    statuses: [401, 403, 409, 429],
  });
});
