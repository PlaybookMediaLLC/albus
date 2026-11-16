import { describe } from "vite-plus/test";
import { describeHookContract } from "../../test/contracts";
import { quillsOperationKey } from "../../api/keys";
import { restoreCommentFixture } from "../../api/team/restore-comment.fixture";
import { useRestoreComment } from "./use-restore-comment";
describe("useRestoreComment", () => {
  describeHookContract({
    kind: "mutation",
    hook: useRestoreComment,
    operationId: "restoreQuillsComment",
    request: {
      param: {
        workspaceId: "workspace_test_1",
        commentId: "comment-id_test_1",
      },
    },
    response: restoreCommentFixture.ok(),
    viewer: { kind: "anonymous" },
    takesViewer: true,
    invalidates: [
      quillsOperationKey(
        "workspace_test_1",
        { kind: "anonymous" },
        "team",
        "listPostComments",
      ),
      quillsOperationKey(
        "workspace_test_1",
        { kind: "anonymous" },
        "team",
        "getPost",
      ),
      quillsOperationKey(
        "workspace_test_1",
        { kind: "anonymous" },
        "team",
        "listPosts",
      ),
    ],
  });
});
