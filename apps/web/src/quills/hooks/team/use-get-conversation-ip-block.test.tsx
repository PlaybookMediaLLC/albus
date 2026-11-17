import { describe } from "vite-plus/test";
import { describeHookContract } from "../../test/contracts";
import { getConversationIpBlockFixture } from "../../api/team/get-conversation-ip-block.fixture";
import { useGetConversationIpBlock } from "./use-get-conversation-ip-block";
describe("useGetConversationIpBlock", () => {
  describeHookContract({
    kind: "query",
    hook: useGetConversationIpBlock,
    operationId: "getQuillsConversationIpBlock",
    request: {
      param: {
        workspaceId: "workspace_test_1",
        conversationId: "conversation-id_test_1",
      },
    },
    emptyRequest: {
      param: { workspaceId: "", conversationId: "conversation-id_test_1" },
    },
    response: getConversationIpBlockFixture.ok(),
    viewer: { kind: "anonymous" },
    takesViewer: false,
    invalidates: [],
  });
});
