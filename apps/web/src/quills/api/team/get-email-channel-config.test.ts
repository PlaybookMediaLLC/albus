import { describe } from "vite-plus/test";
import { describeOperationContract } from "../../test/contracts";
import { getEmailChannelConfig } from "./get-email-channel-config";
import { getEmailChannelConfigFixture } from "./get-email-channel-config.fixture";
describe("getEmailChannelConfig", () => {
  describeOperationContract({
    operationId: "getQuillsEmailChannelConfig",
    operation: getEmailChannelConfig,
    request: { param: { workspaceId: "workspace_test_1" } },
    response: getEmailChannelConfigFixture.ok(),
    method: "get",
    path: "/api/quills/workspace_test_1/support/email-channel",
    statuses: [401, 403, 429],
  });
});
