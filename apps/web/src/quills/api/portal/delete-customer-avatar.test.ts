import { describe } from "vite-plus/test";
import { describeOperationContract } from "../../test/contracts";
import { deleteCustomerAvatar } from "./delete-customer-avatar";
import { deleteCustomerAvatarFixture } from "./delete-customer-avatar.fixture";
describe("deleteCustomerAvatar", () => {
  describeOperationContract({
    operationId: "deleteQuillsCustomerAvatar",
    operation: deleteCustomerAvatar,
    request: { param: { workspace: "workspace_test_1" } },
    response: deleteCustomerAvatarFixture.ok(),
    method: "delete",
    path: "/api/quills-public/workspace_test_1/user/avatar",
    statuses: [401, 403, 404, 429],
  });
});
