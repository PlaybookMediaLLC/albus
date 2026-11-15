import { describe } from "vite-plus/test";
import { describeHookContract } from "../../test/contracts";
import { quillsOperationKey } from "../../api/keys";
import { setInboundTrustFixture } from "../../api/team/set-inbound-trust.fixture";
import { useSetInboundTrust } from "./use-set-inbound-trust";
describe("useSetInboundTrust", () => {
  describeHookContract({
    kind: "mutation",
    hook: useSetInboundTrust,
    operationId: "setQuillsInboundTrust",
    request: {
      param: { workspaceId: "workspace_test_1" },
      json: { inboundTrust: "strict" },
    },
    response: setInboundTrustFixture.ok(),
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
