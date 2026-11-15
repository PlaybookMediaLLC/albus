import { describe } from "vite-plus/test";
import { describeHookContract } from "../../test/contracts";
import { quillsOperationKey } from "../../api/keys";
import { createBoardFixture } from "../../api/team/create-board.fixture";
import { useCreateBoard } from "./use-create-board";
describe("useCreateBoard", () => {
  describeHookContract({
    kind: "mutation",
    hook: useCreateBoard,
    operationId: "createQuillsBoard",
    request: {
      param: { workspaceId: "workspace_test_1" },
      json: { name: "value" },
    },
    response: createBoardFixture.ok(),
    viewer: { kind: "anonymous" },
    takesViewer: true,
    invalidates: [
      quillsOperationKey(
        "workspace_test_1",
        { kind: "anonymous" },
        "team",
        "listBoards",
      ),
    ],
  });
});
