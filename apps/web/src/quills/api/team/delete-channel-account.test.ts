import { describe } from "vite-plus/test";
import { describeOperationContract } from "../../test/contracts";
import { deleteChannelAccount } from "./delete-channel-account";
import { deleteChannelAccountFixture } from "./delete-channel-account.fixture";
describe("deleteChannelAccount", () => {
  describeOperationContract({
    operationId: "deleteQuillsChannelAccount",
    operation: deleteChannelAccount,
    request: {
      param: {
        workspaceId: "workspace_test_1",
        channelAccountId: "channel-account-id_test_1",
      },
    },
    response: deleteChannelAccountFixture.ok(),
    method: "delete",
    path: "/api/quills/workspace_test_1/support/email-channel/sending-addresses/channel-account-id_test_1",
    statuses: [401, 403, 404, 409, 429],
  });
});
