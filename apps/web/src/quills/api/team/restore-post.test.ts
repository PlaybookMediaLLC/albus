import { describe } from "vite-plus/test";
import { describeOperationContract } from "../../test/contracts";
import { restorePost } from "./restore-post";
import { restorePostFixture } from "./restore-post.fixture";
describe("restorePost", () => {
  describeOperationContract({
    operationId: "restoreQuillsPost",
    operation: restorePost,
    request: {
      param: { workspaceId: "workspace_test_1", postId: "post-id_test_1" },
    },
    response: restorePostFixture.ok(),
    method: "post",
    path: "/api/quills/workspace_test_1/posts/post-id_test_1/restore",
    statuses: [401, 403, 404, 409, 429],
  });
});
