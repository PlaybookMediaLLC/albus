import { describe } from "vite-plus/test";
import { describeHookContract } from "../../test/contracts";
import { listFlaggedMessagesFixture } from "../../api/team/list-flagged-messages.fixture";
import { useListFlaggedMessages } from "./use-list-flagged-messages";
describe("useListFlaggedMessages", () => {
  describeHookContract({
    kind: "query",
    hook: useListFlaggedMessages,
    operationId: "listQuillsFlaggedMessages",
    request: { param: { workspaceId: "workspace_test_1" } },
    emptyRequest: { param: { workspaceId: "" } },
    response: listFlaggedMessagesFixture.ok(),
    viewer: { kind: "anonymous" },
    takesViewer: false,
    invalidates: [],
  });
});
