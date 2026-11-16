import { describe } from "vite-plus/test";
import { describeOperationContract } from "../../test/contracts";
import { setCommentReaction } from "./set-comment-reaction";
import { setCommentReactionFixture } from "./set-comment-reaction.fixture";
describe("setCommentReaction", () => {
  describeOperationContract({
    operationId: "setQuillsCommentReaction",
    operation: setCommentReaction,
    request: {
      param: {
        workspaceId: "workspace_test_1",
        commentId: "comment-id_test_1",
      },
      query: { emoji: "value" },
    },
    response: setCommentReactionFixture.ok(),
    method: "put",
    path: "/api/quills/workspace_test_1/comments/comment-id_test_1/reactions",
    statuses: [401, 403, 404, 409, 429],
  });
});
