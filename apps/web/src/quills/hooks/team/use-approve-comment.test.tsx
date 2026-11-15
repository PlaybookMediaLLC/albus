import { describe } from "vite-plus/test";
import { describeHookContract } from "../../test/contracts";
import { quillsOperationKey } from "../../api/keys";
import { approveCommentFixture } from "../../api/team/approve-comment.fixture";
import { useApproveComment } from "./use-approve-comment";
describe("useApproveComment", () => {
  describeHookContract({
    kind: "mutation",
    hook: useApproveComment,
    operationId: "approveQuillsComment",
    request: {
      param: {
        workspaceId: "workspace_test_1",
        commentId: "comment-id_test_1",
      },
    },
    response: approveCommentFixture.ok(),
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
