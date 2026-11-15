import { describe } from "vite-plus/test";
import { describeOperationContract } from "../../test/contracts";
import { getDefaultSlaPolicy } from "./get-default-sla-policy";
import { getDefaultSlaPolicyFixture } from "./get-default-sla-policy.fixture";
describe("getDefaultSlaPolicy", () => {
  describeOperationContract({
    operationId: "getQuillsDefaultSlaPolicy",
    operation: getDefaultSlaPolicy,
    request: { param: { workspaceId: "workspace_test_1" } },
    response: getDefaultSlaPolicyFixture.ok(),
    method: "get",
    path: "/api/quills/workspace_test_1/support/default-sla-policy",
    statuses: [401, 403, 429],
  });
});
