import { describe } from "vite-plus/test";
import { describeOperationContract } from "../../test/contracts";
import { updateComment } from "./update-comment";
import { updateCommentFixture } from "./update-comment.fixture";
describe("updateComment", () => {
  describeOperationContract({
    operationId: "updateQuillsComment",
    operation: updateComment,
    request: {
      param: {
        workspaceId: "workspace_test_1",
        commentId: "comment-id_test_1",
      },
      json: { content: "value" },
    },
    response: updateCommentFixture.ok(),
    method: "patch",
    path: "/api/quills/workspace_test_1/comments/comment-id_test_1",
    statuses: [401, 403, 404, 409, 429],
  });
});
