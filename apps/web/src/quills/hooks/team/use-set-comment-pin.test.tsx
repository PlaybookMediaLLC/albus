import { describe } from "vite-plus/test";
import { describeHookContract } from "../../test/contracts";
import { quillsOperationKey } from "../../api/keys";
import { setCommentPinFixture } from "../../api/team/set-comment-pin.fixture";
import { useSetCommentPin } from "./use-set-comment-pin";
describe("useSetCommentPin", () => {
  describeHookContract({
    kind: "mutation",
    hook: useSetCommentPin,
    operationId: "setQuillsCommentPin",
    request: {
      param: {
        workspaceId: "workspace_test_1",
        postId: "post-id_test_1",
        commentId: "comment-id_test_1",
      },
    },
    response: setCommentPinFixture.ok(),
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
