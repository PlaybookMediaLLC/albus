import { describe } from "vite-plus/test";
import { describeHookContract } from "../../test/contracts";
import { quillsOperationKey } from "../../api/keys";
import { deleteBoardFixture } from "../../api/team/delete-board.fixture";
import { useDeleteBoard } from "./use-delete-board";
describe("useDeleteBoard", () => {
  describeHookContract({
    kind: "mutation",
    hook: useDeleteBoard,
    operationId: "deleteQuillsBoard",
    request: {
      param: { workspaceId: "workspace_test_1", boardId: "board-id_test_1" },
    },
    response: deleteBoardFixture.ok(),
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
