import { describe } from "vite-plus/test";
import { describeOperationContract } from "../../test/contracts";
import { approveComment } from "./approve-comment";
import { approveCommentFixture } from "./approve-comment.fixture";
describe("approveComment", () => {
  describeOperationContract({
    operationId: "approveQuillsComment",
    operation: approveComment,
    request: {
      param: {
        workspaceId: "workspace_test_1",
        commentId: "comment-id_test_1",
      },
    },
    response: approveCommentFixture.ok(),
    method: "post",
    path: "/api/quills/workspace_test_1/moderation/comments/comment-id_test_1/approve",
    statuses: [401, 403, 404, 409, 429],
  });
});
