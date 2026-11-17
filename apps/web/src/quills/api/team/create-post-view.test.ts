import { describe } from "vite-plus/test";
import { describeOperationContract } from "../../test/contracts";
import { createPostView } from "./create-post-view";
import { createPostViewFixture } from "./create-post-view.fixture";
describe("createPostView", () => {
  describeOperationContract({
    operationId: "createQuillsPostView",
    operation: createPostView,
    request: {
      param: { workspaceId: "workspace_test_1" },
      json: { name: "value", filters: {} },
    },
    response: createPostViewFixture.ok(),
    method: "post",
    path: "/api/quills/workspace_test_1/post-views",
    statuses: [401, 403, 429],
  });
});
