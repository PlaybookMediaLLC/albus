import { describe } from "vite-plus/test";
import { describeHookContract } from "../../test/contracts";
import { quillsOperationKey } from "../../api/keys";
import { blockConversationIpFixture } from "../../api/team/block-conversation-ip.fixture";
import { useBlockConversationIp } from "./use-block-conversation-ip";
describe("useBlockConversationIp", () => {
  describeHookContract({
    kind: "mutation",
    hook: useBlockConversationIp,
    operationId: "blockQuillsConversationIp",
    request: {
      param: {
        workspaceId: "workspace_test_1",
        conversationId: "conversation-id_test_1",
      },
    },
    response: blockConversationIpFixture.ok(),
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
