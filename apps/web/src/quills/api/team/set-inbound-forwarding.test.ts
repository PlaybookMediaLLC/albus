import { describe } from "vite-plus/test";
import { describeOperationContract } from "../../test/contracts";
import { setInboundForwarding } from "./set-inbound-forwarding";
import { setInboundForwardingFixture } from "./set-inbound-forwarding.fixture";
describe("setInboundForwarding", () => {
  describeOperationContract({
    operationId: "setQuillsInboundForwarding",
    operation: setInboundForwarding,
    request: {
      param: { workspaceId: "workspace_test_1" },
      json: { forwardingTarget: "person@example.test" },
    },
    response: setInboundForwardingFixture.ok(),
    method: "put",
    path: "/api/quills/workspace_test_1/support/email-channel/inbound",
    statuses: [401, 403, 404, 409, 429],
  });
});
