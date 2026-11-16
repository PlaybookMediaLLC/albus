import { describe } from "vite-plus/test";
import { describeHookContract } from "../../test/contracts";
import { quillsOperationKey } from "../../api/keys";
import { votePostFixture } from "../../api/team/vote-post.fixture";
import { useVotePost } from "./use-vote-post";
describe("useVotePost", () => {
  describeHookContract({
    kind: "mutation",
    hook: useVotePost,
    operationId: "voteQuillsPost",
    request: {
      param: { workspaceId: "workspace_test_1", postId: "post-id_test_1" },
    },
    response: votePostFixture.ok(),
    viewer: { kind: "anonymous" },
    takesViewer: true,
    invalidates: [
      quillsOperationKey(
        "workspace_test_1",
        { kind: "anonymous" },
        "team",
        "getPost",
      ),
      quillsOperationKey(
        "workspace_test_1",
        { kind: "anonymous" },
        "team",
        "listPostVoters",
      ),
      quillsOperationKey(
        "workspace_test_1",
        { kind: "anonymous" },
        "team",
        "listPosts",
      ),
      quillsOperationKey(
        "workspace_test_1",
        { kind: "anonymous" },
        "team",
        "getPostDemand",
      ),
    ],
  });
});
