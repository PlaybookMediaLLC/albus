import { describe } from "vite-plus/test";
import { describeOperationContract } from "../../test/contracts";
import { setDefaultSlaPolicy } from "./set-default-sla-policy";
import { setDefaultSlaPolicyFixture } from "./set-default-sla-policy.fixture";
describe("setDefaultSlaPolicy", () => {
  describeOperationContract({
    operationId: "setQuillsDefaultSlaPolicy",
    operation: setDefaultSlaPolicy,
    request: {
      param: { workspaceId: "workspace_test_1" },
      json: { policyId: null },
    },
    response: setDefaultSlaPolicyFixture.ok(),
    method: "put",
    path: "/api/quills/workspace_test_1/support/default-sla-policy",
    statuses: [401, 403, 404, 409, 429],
  });
});
