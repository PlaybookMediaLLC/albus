import { describe } from "vite-plus/test";
import { describeOperationContract } from "../../test/contracts";
import { clearInboundForwarding } from "./clear-inbound-forwarding";
import { clearInboundForwardingFixture } from "./clear-inbound-forwarding.fixture";
describe("clearInboundForwarding", () => {
  describeOperationContract({
    operationId: "clearQuillsInboundForwarding",
    operation: clearInboundForwarding,
    request: { param: { workspaceId: "workspace_test_1" } },
    response: clearInboundForwardingFixture.ok(),
    method: "delete",
    path: "/api/quills/workspace_test_1/support/email-channel/inbound/forwarding",
    statuses: [401, 403, 404, 409, 429],
  });
});
