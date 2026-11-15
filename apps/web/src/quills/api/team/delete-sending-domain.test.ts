import { describe } from "vite-plus/test";
import { describeOperationContract } from "../../test/contracts";
import { deleteSendingDomain } from "./delete-sending-domain";
import { deleteSendingDomainFixture } from "./delete-sending-domain.fixture";
describe("deleteSendingDomain", () => {
  describeOperationContract({
    operationId: "deleteQuillsSendingDomain",
    operation: deleteSendingDomain,
    request: {
      param: {
        workspaceId: "workspace_test_1",
        sendingDomainId: "sending-domain-id_test_1",
      },
    },
    response: deleteSendingDomainFixture.ok(),
    method: "delete",
    path: "/api/quills/workspace_test_1/support/email-channel/domains/sending-domain-id_test_1",
    statuses: [401, 403, 404, 409, 429],
  });
});
