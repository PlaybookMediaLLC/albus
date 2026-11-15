import { describe } from "vite-plus/test";
import { describeOperationContract } from "../../test/contracts";
import { createSendingAddress } from "./create-sending-address";
import { createSendingAddressFixture } from "./create-sending-address.fixture";
describe("createSendingAddress", () => {
  describeOperationContract({
    operationId: "createQuillsSendingAddress",
    operation: createSendingAddress,
    request: {
      param: { workspaceId: "workspace_test_1" },
      json: { address: "person@example.test", module: "support" },
    },
    response: createSendingAddressFixture.ok(),
    method: "post",
    path: "/api/quills/workspace_test_1/support/email-channel/sending-addresses",
    statuses: [401, 403, 404, 409, 429],
  });
});
