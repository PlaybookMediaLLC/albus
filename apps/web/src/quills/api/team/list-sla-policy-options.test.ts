import { describe } from "vite-plus/test";
import { describeOperationContract } from "../../test/contracts";
import { listSlaPolicyOptions } from "./list-sla-policy-options";
import { listSlaPolicyOptionsFixture } from "./list-sla-policy-options.fixture";
describe("listSlaPolicyOptions", () => {
  describeOperationContract({
    operationId: "listQuillsSlaPolicyOptions",
    operation: listSlaPolicyOptions,
    request: { param: { workspaceId: "workspace_test_1" } },
    response: listSlaPolicyOptionsFixture.ok(),
    method: "get",
    path: "/api/quills/workspace_test_1/sla-policies/options",
    statuses: [401, 403, 429],
  });
});
