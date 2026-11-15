import { describe } from "vite-plus/test";
import { describeHookContract } from "../../test/contracts";
import { listPendingModerationFixture } from "../../api/team/list-pending-moderation.fixture";
import { useListPendingModeration } from "./use-list-pending-moderation";
describe("useListPendingModeration", () => {
  describeHookContract({
    kind: "query",
    hook: useListPendingModeration,
    operationId: "listQuillsPendingModeration",
    request: { param: { workspaceId: "workspace_test_1" } },
    emptyRequest: { param: { workspaceId: "" } },
    response: listPendingModerationFixture.ok(),
    viewer: { kind: "anonymous" },
    takesViewer: false,
    invalidates: [],
  });
});
