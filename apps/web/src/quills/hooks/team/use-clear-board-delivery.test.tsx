import { describe } from "vite-plus/test";
import { describeHookContract } from "../../test/contracts";
import { quillsOperationKey } from "../../api/keys";
import { clearBoardDeliveryFixture } from "../../api/team/clear-board-delivery.fixture";
import { useClearBoardDelivery } from "./use-clear-board-delivery";
describe("useClearBoardDelivery", () => {
  describeHookContract({
    kind: "mutation",
    hook: useClearBoardDelivery,
    operationId: "clearQuillsBoardDelivery",
    request: {
      param: { workspaceId: "workspace_test_1", boardId: "board-id_test_1" },
    },
    response: clearBoardDeliveryFixture.ok(),
    viewer: { kind: "anonymous" },
    takesViewer: true,
    invalidates: [
      quillsOperationKey(
        "workspace_test_1",
        { kind: "anonymous" },
        "team",
        "getBoardSettings",
      ),
    ],
  });
});
