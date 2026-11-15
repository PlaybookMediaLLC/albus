import { describe } from "vite-plus/test";
import { describeOperationContract } from "../../test/contracts";
import { setInboundTrust } from "./set-inbound-trust";
import { setInboundTrustFixture } from "./set-inbound-trust.fixture";
describe("setInboundTrust", () => {
  describeOperationContract({
    operationId: "setQuillsInboundTrust",
    operation: setInboundTrust,
    request: {
      param: { workspaceId: "workspace_test_1" },
      json: { inboundTrust: "strict" },
    },
    response: setInboundTrustFixture.ok(),
    method: "put",
    path: "/api/quills/workspace_test_1/support/email-channel/inbound/trust",
    statuses: [401, 403, 404, 409, 429],
  });
});
