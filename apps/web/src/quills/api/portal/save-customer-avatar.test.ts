import { describe } from "vite-plus/test";
import { describeOperationContract } from "../../test/contracts";
import { saveCustomerAvatar } from "./save-customer-avatar";
import { saveCustomerAvatarFixture } from "./save-customer-avatar.fixture";
describe("saveCustomerAvatar", () => {
  describeOperationContract({
    operationId: "saveQuillsCustomerAvatar",
    operation: saveCustomerAvatar,
    request: {
      param: { workspace: "workspace_test_1" },
      json: { key: "value", contentType: "value", size: 0 },
    },
    response: saveCustomerAvatarFixture.ok(),
    method: "put",
    path: "/api/quills-public/workspace_test_1/user/avatar",
    statuses: [401, 403, 404, 409, 429],
  });
});
