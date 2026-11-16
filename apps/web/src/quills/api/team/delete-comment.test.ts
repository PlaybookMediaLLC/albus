import { describe } from "vite-plus/test";
import { describeOperationContract } from "../../test/contracts";
import { deleteComment } from "./delete-comment";
import { deleteCommentFixture } from "./delete-comment.fixture";
describe("deleteComment", () => {
  describeOperationContract({
    operationId: "deleteQuillsComment",
    operation: deleteComment,
    request: {
      param: {
        workspaceId: "workspace_test_1",
        commentId: "comment-id_test_1",
      },
    },
    response: deleteCommentFixture.ok(),
    method: "delete",
    path: "/api/quills/workspace_test_1/comments/comment-id_test_1",
    statuses: [401, 403, 404, 409, 429],
  });
});
