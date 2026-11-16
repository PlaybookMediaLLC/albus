import { describe } from "vite-plus/test";
import { describeOperationContract } from "../../test/contracts";
import { createUser } from "./create-user";
import { createUserFixture } from "./create-user.fixture";
describe("createUser", () => {
  describeOperationContract({
    operationId: "createQuillsUser",
    operation: createUser,
    request: {
      param: { workspaceId: "workspace_test_1" },
      json: { name: "value" },
    },
    response: createUserFixture.ok(),
    method: "post",
    path: "/api/quills/workspace_test_1/users",
    statuses: [401, 403, 409, 429],
  });
});
