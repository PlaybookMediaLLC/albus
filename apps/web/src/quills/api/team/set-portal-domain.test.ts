import { describe } from "vite-plus/test";
import { describeOperationContract } from "../../test/contracts";
import { setPortalDomain } from "./set-portal-domain";
import { setPortalDomainFixture } from "./set-portal-domain.fixture";
describe("setPortalDomain", () => {
  describeOperationContract({
    operationId: "setQuillsPortalDomain",
    operation: setPortalDomain,
    request: {
      param: { workspaceId: "workspace_test_1" },
      json: { domain: "value" },
    },
    response: setPortalDomainFixture.ok(),
    method: "put",
    path: "/api/quills/workspace_test_1/operations/domains/portal",
    statuses: [401, 403, 409, 429],
  });
});
