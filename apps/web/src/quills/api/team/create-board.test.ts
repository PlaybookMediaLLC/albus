import { describe } from "vite-plus/test";
import { describeOperationContract } from "../../test/contracts";
import { createBoard } from "./create-board";
import { createBoardFixture } from "./create-board.fixture";
describe("createBoard", () => {
  describeOperationContract({
    operationId: "createQuillsBoard",
    operation: createBoard,
    request: {
      param: { workspaceId: "workspace_test_1" },
      json: { name: "value" },
    },
    response: createBoardFixture.ok(),
    method: "post",
    path: "/api/quills/workspace_test_1/boards",
    statuses: [401, 403, 404, 409, 429],
  });
});
