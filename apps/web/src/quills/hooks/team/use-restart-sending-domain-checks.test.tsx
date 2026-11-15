import { describe } from "vite-plus/test";
import { describeHookContract } from "../../test/contracts";
import { quillsOperationKey } from "../../api/keys";
import { restartSendingDomainChecksFixture } from "../../api/team/restart-sending-domain-checks.fixture";
import { useRestartSendingDomainChecks } from "./use-restart-sending-domain-checks";
describe("useRestartSendingDomainChecks", () => {
  describeHookContract({
    kind: "mutation",
    hook: useRestartSendingDomainChecks,
    operationId: "restartQuillsSendingDomainChecks",
    request: {
      param: {
        workspaceId: "workspace_test_1",
        sendingDomainId: "sending-domain-id_test_1",
      },
    },
    response: restartSendingDomainChecksFixture.ok(),
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
