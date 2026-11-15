import { describe } from "vite-plus/test";
import { describeOperationContract } from "../../test/contracts";
import { setPoweredBy } from "./set-powered-by";
import { setPoweredByFixture } from "./set-powered-by.fixture";
describe("setPoweredBy", () => {
  describeOperationContract({
    operationId: "setQuillsPoweredBy",
    operation: setPoweredBy,
    request: {
      param: { workspaceId: "workspace_test_1" },
      json: { showPoweredBy: false },
    },
    response: setPoweredByFixture.ok(),
    method: "put",
    path: "/api/quills/workspace_test_1/operations/powered-by",
    statuses: [401, 403, 429],
  });
});
