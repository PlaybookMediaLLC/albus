import { describe } from "vite-plus/test";
import { describeHookContract } from "../../test/contracts";
import { getAwayReplyFixture } from "../../api/team/get-away-reply.fixture";
import { useGetAwayReply } from "./use-get-away-reply";
describe("useGetAwayReply", () => {
  describeHookContract({
    kind: "query",
    hook: useGetAwayReply,
    operationId: "getQuillsAwayReply",
    request: { param: { workspaceId: "workspace_test_1" } },
    emptyRequest: { param: { workspaceId: "" } },
    response: getAwayReplyFixture.ok(),
    viewer: { kind: "anonymous" },
    takesViewer: false,
    invalidates: [],
  });
});
