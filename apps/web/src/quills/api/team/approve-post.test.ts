import { describe } from "vite-plus/test";
import { describeOperationContract } from "../../test/contracts";
import { approvePost } from "./approve-post";
import { approvePostFixture } from "./approve-post.fixture";
describe("approvePost", () => {
  describeOperationContract({
    operationId: "approveQuillsPost",
    operation: approvePost,
    request: {
      param: { workspaceId: "workspace_test_1", postId: "post-id_test_1" },
    },
    response: approvePostFixture.ok(),
    method: "post",
    path: "/api/quills/workspace_test_1/moderation/posts/post-id_test_1/approve",
    statuses: [401, 403, 404, 409, 429],
  });
});
