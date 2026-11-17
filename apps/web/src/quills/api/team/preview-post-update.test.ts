import { describe } from "vite-plus/test";
import { describeOperationContract } from "../../test/contracts";
import { previewPostUpdate } from "./preview-post-update";
import { previewPostUpdateFixture } from "./preview-post-update.fixture";
describe("previewPostUpdate", () => {
  describeOperationContract({
    operationId: "previewQuillsPostUpdate",
    operation: previewPostUpdate,
    request: {
      param: { workspaceId: "workspace_test_1", postId: "post-id_test_1" },
      json: {
        channels: {
          page: false,
          email: false,
          conversations: false,
          slack: false,
        },
      },
    },
    response: previewPostUpdateFixture.ok(),
    method: "post",
    path: "/api/quills/workspace_test_1/posts/post-id_test_1/updates/preview",
    statuses: [401, 403, 404, 429],
  });
});
