import { describe } from "vite-plus/test";
import { describeHookContract } from "../../test/contracts";
import { getModerationStatusFixture } from "../../api/team/get-moderation-status.fixture";
import { useGetModerationStatus } from "./use-get-moderation-status";
describe("useGetModerationStatus", () => {
  describeHookContract({
    kind: "query",
    hook: useGetModerationStatus,
    operationId: "getQuillsModerationStatus",
    request: { param: { workspaceId: "workspace_test_1" } },
    emptyRequest: { param: { workspaceId: "" } },
    response: getModerationStatusFixture.ok(),
    viewer: { kind: "anonymous" },
    takesViewer: false,
    invalidates: [],
  });
});
