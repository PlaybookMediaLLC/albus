import { describe } from "vite-plus/test";
import { describeOperationContract } from "../../test/contracts";
import { setCommentPin } from "./set-comment-pin";
import { setCommentPinFixture } from "./set-comment-pin.fixture";
describe("setCommentPin", () => {
  describeOperationContract({
    operationId: "setQuillsCommentPin",
    operation: setCommentPin,
    request: {
      param: {
        workspaceId: "workspace_test_1",
        postId: "post-id_test_1",
        commentId: "comment-id_test_1",
      },
    },
    response: setCommentPinFixture.ok(),
    method: "put",
    path: "/api/quills/workspace_test_1/posts/post-id_test_1/pinned-comment/comment-id_test_1",
    statuses: [401, 403, 404, 409, 429],
  });
});
