import { describe } from "vite-plus/test";
import { describeOperationContract } from "../../test/contracts";
import { rejectPost } from "./reject-post";
import { rejectPostFixture } from "./reject-post.fixture";
describe("rejectPost", () => {
  describeOperationContract({
    operationId: "rejectQuillsPost",
    operation: rejectPost,
    request: {
      param: { workspaceId: "workspace_test_1", postId: "post-id_test_1" },
      json: { reason: "value" },
    },
    response: rejectPostFixture.ok(),
    method: "post",
    path: "/api/quills/workspace_test_1/moderation/posts/post-id_test_1/reject",
    statuses: [401, 403, 404, 409, 429],
  });
});
