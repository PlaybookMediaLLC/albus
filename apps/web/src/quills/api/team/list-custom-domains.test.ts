import { describe } from "vite-plus/test";
import { describeOperationContract } from "../../test/contracts";
import { listCustomDomains } from "./list-custom-domains";
import { listCustomDomainsFixture } from "./list-custom-domains.fixture";
describe("listCustomDomains", () => {
  describeOperationContract({
    operationId: "listQuillsCustomDomains",
    operation: listCustomDomains,
    request: { param: { workspaceId: "workspace_test_1" } },
    response: listCustomDomainsFixture.ok(),
    method: "get",
    path: "/api/quills/workspace_test_1/operations/domains",
    statuses: [401, 403, 429],
  });
});
