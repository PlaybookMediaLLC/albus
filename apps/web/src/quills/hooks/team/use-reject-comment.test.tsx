import { describe } from "vite-plus/test";
import { describeHookContract } from "../../test/contracts";
import { quillsOperationKey } from "../../api/keys";
import { rejectCommentFixture } from "../../api/team/reject-comment.fixture";
import { useRejectComment } from "./use-reject-comment";
describe("useRejectComment", () => {
  describeHookContract({
    kind: "mutation",
    hook: useRejectComment,
    operationId: "rejectQuillsComment",
    request: {
      param: {
        workspaceId: "workspace_test_1",
        commentId: "comment-id_test_1",
      },
      json: { reason: "value" },
    },
    response: rejectCommentFixture.ok(),
    viewer: { kind: "anonymous" },
    takesViewer: true,
    invalidates: [
      quillsOperationKey(
        "workspace_test_1",
        { kind: "anonymous" },
        "team",
        "listPendingModeration",
      ),
      quillsOperationKey(
        "workspace_test_1",
        { kind: "anonymous" },
        "team",
        "getModerationStatus",
      ),
    ],
  });
});
