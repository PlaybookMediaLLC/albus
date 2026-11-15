import { describe } from "vite-plus/test";
import { describeOperationContract } from "../../test/contracts";
import { listUserComments } from "./list-user-comments";
import { listUserCommentsFixture } from "./list-user-comments.fixture";
describe("listUserComments", () => {
  describeOperationContract({
    operationId: "listQuillsUserComments",
    operation: listUserComments,
    request: {
      param: {
        workspaceId: "workspace_test_1",
        principalId: "principal-id_test_1",
      },
    },
    response: listUserCommentsFixture.ok(),
    method: "get",
    path: "/api/quills/workspace_test_1/users/principal-id_test_1/comments",
    statuses: [401, 403, 404, 429],
  });
});
