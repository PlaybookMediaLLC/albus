import { describe } from "vite-plus/test";
import { describeHookContract } from "../../test/contracts";
import { quillsOperationKey } from "../../api/keys";
import { createSendingAddressFixture } from "../../api/team/create-sending-address.fixture";
import { useCreateSendingAddress } from "./use-create-sending-address";
describe("useCreateSendingAddress", () => {
  describeHookContract({
    kind: "mutation",
    hook: useCreateSendingAddress,
    operationId: "createQuillsSendingAddress",
    request: {
      param: { workspaceId: "workspace_test_1" },
      json: { address: "person@example.test", module: "support" },
    },
    response: createSendingAddressFixture.ok(),
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
