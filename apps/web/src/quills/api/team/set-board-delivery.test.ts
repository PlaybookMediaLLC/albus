import { describe } from "vite-plus/test";
import { describeOperationContract } from "../../test/contracts";
import { setBoardDelivery } from "./set-board-delivery";
import { setBoardDeliveryFixture } from "./set-board-delivery.fixture";
describe("setBoardDelivery", () => {
  describeOperationContract({
    operationId: "setQuillsBoardDelivery",
    operation: setBoardDelivery,
    request: {
      param: { workspaceId: "workspace_test_1", boardId: "board-id_test_1" },
      json: {
        projectId: "project_id_test_1",
        columnId: null,
        priority: "no-priority",
        triggerStatusId: null,
      },
    },
    response: setBoardDeliveryFixture.ok(),
    method: "put",
    path: "/api/quills/workspace_test_1/boards/board-id_test_1/delivery",
    statuses: [401, 403, 404, 409, 429],
  });
});
