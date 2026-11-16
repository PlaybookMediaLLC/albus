import { describe } from "vite-plus/test";
import { describeOperationContract } from "../../test/contracts";
import { votePost } from "./vote-post";
import { votePostFixture } from "./vote-post.fixture";
describe("votePost", () => {
  describeOperationContract({
    operationId: "voteQuillsPost",
    operation: votePost,
    request: {
      param: { workspaceId: "workspace_test_1", postId: "post-id_test_1" },
    },
    response: votePostFixture.ok(),
    method: "put",
    path: "/api/quills/workspace_test_1/posts/post-id_test_1/vote",
    statuses: [401, 403, 404, 429],
  });
});
