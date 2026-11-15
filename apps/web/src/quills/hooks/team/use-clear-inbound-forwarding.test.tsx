import { describe } from "vite-plus/test";
import { describeHookContract } from "../../test/contracts";
import { quillsOperationKey } from "../../api/keys";
import { clearInboundForwardingFixture } from "../../api/team/clear-inbound-forwarding.fixture";
import { useClearInboundForwarding } from "./use-clear-inbound-forwarding";
describe("useClearInboundForwarding", () => {
  describeHookContract({
    kind: "mutation",
    hook: useClearInboundForwarding,
    operationId: "clearQuillsInboundForwarding",
    request: { param: { workspaceId: "workspace_test_1" } },
    response: clearInboundForwardingFixture.ok(),
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
