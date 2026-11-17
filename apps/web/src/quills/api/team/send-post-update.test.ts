import { describe } from "vite-plus/test";
import { describeOperationContract } from "../../test/contracts";
import { sendPostUpdate } from "./send-post-update";
import { sendPostUpdateFixture } from "./send-post-update.fixture";
describe("sendPostUpdate", () => {
  describeOperationContract({
    operationId: "sendQuillsPostUpdate",
    operation: sendPostUpdate,
    request: {
      param: { workspaceId: "workspace_test_1", postId: "post-id_test_1" },
      json: {
        channels: {
          page: false,
          email: false,
          conversations: false,
          slack: false,
        },
        body: "value",
        idempotencyKey: "value",
      },
    },
    response: sendPostUpdateFixture.ok(),
    method: "post",
    path: "/api/quills/workspace_test_1/posts/post-id_test_1/updates",
    statuses: [401, 403, 404, 409, 429],
  });
});
