import { describe } from "vite-plus/test";
import { describeOperationContract } from "../../test/contracts";
import { summarizePost } from "./summarize-post";
import { summarizePostFixture } from "./summarize-post.fixture";
describe("summarizePost", () => {
  describeOperationContract({
    operationId: "summarizeQuillsPost",
    operation: summarizePost,
    request: {
      param: { workspaceId: "workspace_test_1", postId: "post-id_test_1" },
    },
    response: summarizePostFixture.ok(),
    method: "post",
    path: "/api/quills/workspace_test_1/posts/post-id_test_1/summary",
    statuses: [401, 403, 404, 409, 429, 502],
  });
});
