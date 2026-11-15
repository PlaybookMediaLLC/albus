import { describe } from "vite-plus/test";
import { describeOperationContract } from "../../test/contracts";
import { getEmailChannelStatus } from "./get-email-channel-status";
import { getEmailChannelStatusFixture } from "./get-email-channel-status.fixture";
describe("getEmailChannelStatus", () => {
  describeOperationContract({
    operationId: "getQuillsEmailChannelStatus",
    operation: getEmailChannelStatus,
    request: { param: { workspaceId: "workspace_test_1" } },
    response: getEmailChannelStatusFixture.ok(),
    method: "get",
    path: "/api/quills/workspace_test_1/support/email-channel/status",
    statuses: [401, 403, 429],
  });
});
