import { describe } from "vite-plus/test";
import { describeHookContract } from "../../test/contracts";
import { quillsOperationKey } from "../../api/keys";
import { reorderStatusesFixture } from "../../api/team/reorder-statuses.fixture";
import { useReorderStatuses } from "./use-reorder-statuses";
describe("useReorderStatuses", () => {
  describeHookContract({
    kind: "mutation",
    hook: useReorderStatuses,
    operationId: "reorderQuillsStatuses",
    request: {
      param: { workspaceId: "workspace_test_1" },
      json: { statusIds: [] },
    },
    response: reorderStatusesFixture.ok(),
    viewer: { kind: "anonymous" },
    takesViewer: true,
    invalidates: [
      quillsOperationKey(
        "workspace_test_1",
        { kind: "anonymous" },
        "team",
        "listStatuses",
      ),
      quillsOperationKey(
        "workspace_test_1",
        { kind: "anonymous" },
        "team",
        "getTeamCounts",
      ),
    ],
  });
});
