import { describe } from "vite-plus/test";
import { describeOperationContract } from "../../test/contracts";
import { restartSendingDomainChecks } from "./restart-sending-domain-checks";
import { restartSendingDomainChecksFixture } from "./restart-sending-domain-checks.fixture";
describe("restartSendingDomainChecks", () => {
  describeOperationContract({
    operationId: "restartQuillsSendingDomainChecks",
    operation: restartSendingDomainChecks,
    request: {
      param: {
        workspaceId: "workspace_test_1",
        sendingDomainId: "sending-domain-id_test_1",
      },
    },
    response: restartSendingDomainChecksFixture.ok(),
    method: "post",
    path: "/api/quills/workspace_test_1/support/email-channel/domains/sending-domain-id_test_1/checks",
    statuses: [401, 403, 404, 409, 429],
  });
});
