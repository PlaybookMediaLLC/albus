import { describe } from "vite-plus/test";
import { describeOperationContract } from "../../test/contracts";
import { clearBoardDelivery } from "./clear-board-delivery";
import { clearBoardDeliveryFixture } from "./clear-board-delivery.fixture";
describe("clearBoardDelivery", () => {
  describeOperationContract({
    operationId: "clearQuillsBoardDelivery",
    operation: clearBoardDelivery,
    request: {
      param: { workspaceId: "workspace_test_1", boardId: "board-id_test_1" },
    },
    response: clearBoardDeliveryFixture.ok(),
    method: "delete",
    path: "/api/quills/workspace_test_1/boards/board-id_test_1/delivery",
    statuses: [401, 403, 404, 429],
  });
});
