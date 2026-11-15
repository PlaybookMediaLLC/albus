import { describe } from "vite-plus/test";
import { describeOperationContract } from "../../test/contracts";
import { reorderStatuses } from "./reorder-statuses";
import { reorderStatusesFixture } from "./reorder-statuses.fixture";
describe("reorderStatuses", () => {
  describeOperationContract({
    operationId: "reorderQuillsStatuses",
    operation: reorderStatuses,
    request: {
      param: { workspaceId: "workspace_test_1" },
      json: { statusIds: [] },
    },
    response: reorderStatusesFixture.ok(),
    method: "put",
    path: "/api/quills/workspace_test_1/statuses/order",
    statuses: [401, 403, 404, 409, 429],
  });
});
