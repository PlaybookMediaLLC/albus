import { describe } from "vite-plus/test";
import { describeOperationContract } from "../../test/contracts";
import { updateUser } from "./update-user";
import { updateUserFixture } from "./update-user.fixture";
describe("updateUser", () => {
  describeOperationContract({
    operationId: "updateQuillsUser",
    operation: updateUser,
    request: {
      param: {
        workspaceId: "workspace_test_1",
        principalId: "principal-id_test_1",
      },
      json: {},
    },
    response: updateUserFixture.ok(),
    method: "put",
    path: "/api/quills/workspace_test_1/users/principal-id_test_1",
    statuses: [401, 403, 404, 409, 429],
  });
});
