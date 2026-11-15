import { describe } from "vite-plus/test";
import { describeOperationContract } from "../../test/contracts";
import { rejectComment } from "./reject-comment";
import { rejectCommentFixture } from "./reject-comment.fixture";
describe("rejectComment", () => {
  describeOperationContract({
    operationId: "rejectQuillsComment",
    operation: rejectComment,
    request: {
      param: {
        workspaceId: "workspace_test_1",
        commentId: "comment-id_test_1",
      },
      json: { reason: "value" },
    },
    response: rejectCommentFixture.ok(),
    method: "post",
    path: "/api/quills/workspace_test_1/moderation/comments/comment-id_test_1/reject",
    statuses: [401, 403, 404, 409, 429],
  });
});
