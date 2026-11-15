import { describe } from "vite-plus/test";
import { describeHookContract } from "../../test/contracts";
import { quillsOperationKey } from "../../api/keys";
import { setInboundForwardingFixture } from "../../api/team/set-inbound-forwarding.fixture";
import { useSetInboundForwarding } from "./use-set-inbound-forwarding";
describe("useSetInboundForwarding", () => {
  describeHookContract({
    kind: "mutation",
    hook: useSetInboundForwarding,
    operationId: "setQuillsInboundForwarding",
    request: {
      param: { workspaceId: "workspace_test_1" },
      json: { forwardingTarget: "person@example.test" },
    },
    response: setInboundForwardingFixture.ok(),
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
