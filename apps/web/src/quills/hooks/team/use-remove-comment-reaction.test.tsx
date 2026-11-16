import { describe } from "vite-plus/test";
import { describeHookContract } from "../../test/contracts";
import { quillsOperationKey } from "../../api/keys";
import { removeCommentReactionFixture } from "../../api/team/remove-comment-reaction.fixture";
import { useRemoveCommentReaction } from "./use-remove-comment-reaction";
describe("useRemoveCommentReaction", () => {
  describeHookContract({
    kind: "mutation",
    hook: useRemoveCommentReaction,
    operationId: "removeQuillsCommentReaction",
    request: {
      param: {
        workspaceId: "workspace_test_1",
        commentId: "comment-id_test_1",
      },
      query: { emoji: "value" },
    },
    response: removeCommentReactionFixture.ok(),
    viewer: { kind: "anonymous" },
    takesViewer: true,
    invalidates: [
      quillsOperationKey(
        "workspace_test_1",
        { kind: "anonymous" },
        "team",
        "listPostComments",
      ),
    ],
  });
});
