import { describe } from "vite-plus/test";
import { describeHookContract } from "../../test/contracts";
import { quillsOperationKey } from "../../api/keys";
import { setAwayReplyFixture } from "../../api/team/set-away-reply.fixture";
import { useSetAwayReply } from "./use-set-away-reply";
describe("useSetAwayReply", () => {
  describeHookContract({
    kind: "mutation",
    hook: useSetAwayReply,
    operationId: "setQuillsAwayReply",
    request: {
      param: { workspaceId: "workspace_test_1" },
      json: { enabled: false, message: "value" },
    },
    response: setAwayReplyFixture.ok(),
    viewer: { kind: "anonymous" },
    takesViewer: true,
    invalidates: [
      quillsOperationKey(
        "workspace_test_1",
        { kind: "anonymous" },
        "team",
        "getAwayReply",
      ),
    ],
  });
});
