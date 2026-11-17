import { describe } from "vite-plus/test";
import { describeHookContract } from "../../test/contracts";
import { quillsOperationKey } from "../../api/keys";
import { unblockConversationIpFixture } from "../../api/team/unblock-conversation-ip.fixture";
import { useUnblockConversationIp } from "./use-unblock-conversation-ip";
describe("useUnblockConversationIp", () => {
  describeHookContract({
    kind: "mutation",
    hook: useUnblockConversationIp,
    operationId: "unblockQuillsConversationIp",
    request: {
      param: {
        workspaceId: "workspace_test_1",
        conversationId: "conversation-id_test_1",
      },
    },
    response: unblockConversationIpFixture.ok(),
    viewer: { kind: "anonymous" },
    takesViewer: true,
    invalidates: [
      quillsOperationKey(
        "workspace_test_1",
        { kind: "anonymous" },
        "team",
        "getConversationIpBlock",
      ),
    ],
  });
});
