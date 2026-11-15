import { describe } from "vite-plus/test";
import { describeHookContract } from "../../test/contracts";
import { quillsOperationKey } from "../../api/keys";
import { deleteSendingDomainFixture } from "../../api/team/delete-sending-domain.fixture";
import { useDeleteSendingDomain } from "./use-delete-sending-domain";
describe("useDeleteSendingDomain", () => {
  describeHookContract({
    kind: "mutation",
    hook: useDeleteSendingDomain,
    operationId: "deleteQuillsSendingDomain",
    request: {
      param: {
        workspaceId: "workspace_test_1",
        sendingDomainId: "sending-domain-id_test_1",
      },
    },
    response: deleteSendingDomainFixture.ok(),
    viewer: { kind: "anonymous" },
    takesViewer: true,
    invalidates: [
      quillsOperationKey(
        "workspace_test_1",
        { kind: "anonymous" },
        "team",
        "getEmailChannelConfig",
      ),
    ],
  });
});
