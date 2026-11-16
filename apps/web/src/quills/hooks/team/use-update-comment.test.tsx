import { describe } from "vite-plus/test";
import { describeHookContract } from "../../test/contracts";
import { quillsOperationKey } from "../../api/keys";
import { updateCommentFixture } from "../../api/team/update-comment.fixture";
import { useUpdateComment } from "./use-update-comment";
describe("useUpdateComment", () => {
  describeHookContract({
    kind: "mutation",
    hook: useUpdateComment,
    operationId: "updateQuillsComment",
    request: {
      param: {
        workspaceId: "workspace_test_1",
        commentId: "comment-id_test_1",
      },
      json: { content: "value" },
    },
    response: updateCommentFixture.ok(),
    viewer: { kind: "anonymous" },
    takesViewer: true,
    invalidates: [
      quillsOperationKey(
        "workspace_test_1",
        { kind: "anonymous" },
        "team",
        "listPostComments",
      ),
    ],
  });
});
