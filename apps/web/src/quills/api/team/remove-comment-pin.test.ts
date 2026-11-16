import { describe } from "vite-plus/test";
import { describeOperationContract } from "../../test/contracts";
import { removeCommentPin } from "./remove-comment-pin";
import { removeCommentPinFixture } from "./remove-comment-pin.fixture";
describe("removeCommentPin", () => {
  describeOperationContract({
    operationId: "removeQuillsCommentPin",
    operation: removeCommentPin,
    request: {
      param: {
        workspaceId: "workspace_test_1",
        postId: "post-id_test_1",
        commentId: "comment-id_test_1",
      },
    },
    response: removeCommentPinFixture.ok(),
    method: "delete",
    path: "/api/quills/workspace_test_1/posts/post-id_test_1/pinned-comment/comment-id_test_1",
    statuses: [401, 403, 404, 409, 429],
  });
});
