import { describe } from "vite-plus/test";
import { describeHookContract } from "../../test/contracts";
import { quillsOperationKey } from "../../api/keys";
import { setBoardDeliveryFixture } from "../../api/team/set-board-delivery.fixture";
import { useSetBoardDelivery } from "./use-set-board-delivery";
describe("useSetBoardDelivery", () => {
  describeHookContract({
    kind: "mutation",
    hook: useSetBoardDelivery,
    operationId: "setQuillsBoardDelivery",
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
