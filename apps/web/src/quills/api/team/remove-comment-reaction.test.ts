import { describe } from "vite-plus/test";
import { describeOperationContract } from "../../test/contracts";
import { removeCommentReaction } from "./remove-comment-reaction";
import { removeCommentReactionFixture } from "./remove-comment-reaction.fixture";
describe("removeCommentReaction", () => {
  describeOperationContract({
    operationId: "removeQuillsCommentReaction",
    operation: removeCommentReaction,
    request: {
      param: {
        workspaceId: "workspace_test_1",
        commentId: "comment-id_test_1",
      },
      query: { emoji: "value" },
    },
    response: removeCommentReactionFixture.ok(),
    method: "delete",
    path: "/api/quills/workspace_test_1/comments/comment-id_test_1/reactions",
    statuses: [401, 403, 404, 409, 429],
  });
});
