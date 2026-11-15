import { describe } from "vite-plus/test";
import { describeOperationContract } from "../../test/contracts";
import { deleteBoard } from "./delete-board";
import { deleteBoardFixture } from "./delete-board.fixture";
describe("deleteBoard", () => {
  describeOperationContract({
    operationId: "deleteQuillsBoard",
    operation: deleteBoard,
    request: {
      param: { workspaceId: "workspace_test_1", boardId: "board-id_test_1" },
    },
    response: deleteBoardFixture.ok(),
    method: "delete",
    path: "/api/quills/workspace_test_1/boards/board-id_test_1",
    statuses: [401, 403, 404, 409, 429],
  });
});
