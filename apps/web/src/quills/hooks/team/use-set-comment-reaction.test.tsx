import { describe } from "vite-plus/test";
import { describeHookContract } from "../../test/contracts";
import { quillsOperationKey } from "../../api/keys";
import { setCommentReactionFixture } from "../../api/team/set-comment-reaction.fixture";
import { useSetCommentReaction } from "./use-set-comment-reaction";
describe("useSetCommentReaction", () => {
  describeHookContract({
    kind: "mutation",
    hook: useSetCommentReaction,
    operationId: "setQuillsCommentReaction",
    request: {
      param: {
        workspaceId: "workspace_test_1",
        commentId: "comment-id_test_1",
      },
      query: { emoji: "value" },
    },
    response: setCommentReactionFixture.ok(),
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
