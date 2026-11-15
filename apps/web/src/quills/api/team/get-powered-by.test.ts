import { describe } from "vite-plus/test";
import { describeOperationContract } from "../../test/contracts";
import { getPoweredBy } from "./get-powered-by";
import { getPoweredByFixture } from "./get-powered-by.fixture";
describe("getPoweredBy", () => {
  describeOperationContract({
    operationId: "getQuillsPoweredBy",
    operation: getPoweredBy,
    request: { param: { workspaceId: "workspace_test_1" } },
    response: getPoweredByFixture.ok(),
    method: "get",
    path: "/api/quills/workspace_test_1/operations/powered-by",
    statuses: [401, 403, 429],
  });
});
