import { describe } from "vite-plus/test";
import { describeOperationContract } from "../../test/contracts";
import { restoreComment } from "./restore-comment";
import { restoreCommentFixture } from "./restore-comment.fixture";
describe("restoreComment", () => {
  describeOperationContract({
    operationId: "restoreQuillsComment",
    operation: restoreComment,
    request: {
      param: {
        workspaceId: "workspace_test_1",
        commentId: "comment-id_test_1",
      },
    },
    response: restoreCommentFixture.ok(),
    method: "post",
    path: "/api/quills/workspace_test_1/comments/comment-id_test_1/restore",
    statuses: [401, 403, 404, 409, 429],
  });
});
