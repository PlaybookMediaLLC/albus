import { describe } from "vite-plus/test";
import { describeOperationContract } from "../../test/contracts";
import { deleteUser } from "./delete-user";
import { deleteUserFixture } from "./delete-user.fixture";
describe("deleteUser", () => {
  describeOperationContract({
    operationId: "deleteQuillsUser",
    operation: deleteUser,
    request: {
      param: {
        workspaceId: "workspace_test_1",
        principalId: "principal-id_test_1",
      },
    },
    response: deleteUserFixture.ok(),
    method: "delete",
    path: "/api/quills/workspace_test_1/users/principal-id_test_1",
    statuses: [401, 403, 404, 409, 429],
  });
});
