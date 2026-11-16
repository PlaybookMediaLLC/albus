import { describe } from "vite-plus/test";
import { describeHookContract } from "../../test/contracts";
import { quillsOperationKey } from "../../api/keys";
import { removeCommentPinFixture } from "../../api/team/remove-comment-pin.fixture";
import { useRemoveCommentPin } from "./use-remove-comment-pin";
describe("useRemoveCommentPin", () => {
  describeHookContract({
    kind: "mutation",
    hook: useRemoveCommentPin,
    operationId: "removeQuillsCommentPin",
    request: {
      param: {
        workspaceId: "workspace_test_1",
        postId: "post-id_test_1",
        commentId: "comment-id_test_1",
      },
    },
    response: removeCommentPinFixture.ok(),
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
    ],
  });
});
