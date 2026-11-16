import { describe } from "vite-plus/test";
import { describeOperationContract } from "../../test/contracts";
import { setPostVisibility } from "./set-post-visibility";
import { setPostVisibilityFixture } from "./set-post-visibility.fixture";
describe("setPostVisibility", () => {
  describeOperationContract({
    operationId: "setQuillsPostVisibility",
    operation: setPostVisibility,
    request: {
      param: { workspaceId: "workspace_test_1", postId: "post-id_test_1" },
      json: { visible: false },
    },
    response: setPostVisibilityFixture.ok(),
    method: "put",
    path: "/api/quills/workspace_test_1/posts/post-id_test_1/visibility",
    statuses: [401, 403, 404, 409, 429],
  });
});
