import { describe } from "vite-plus/test";
import { describeHookContract } from "../../test/contracts";
import { quillsOperationKey } from "../../api/keys";
import { unlinkPostFromConversationFixture } from "../../api/team/unlink-post-from-conversation.fixture";
import { useUnlinkPostFromConversation } from "./use-unlink-post-from-conversation";
describe("useUnlinkPostFromConversation", () => {
  describeHookContract({
    kind: "mutation",
    hook: useUnlinkPostFromConversation,
    operationId: "unlinkQuillsPostFromConversation",
    request: {
      param: {
        workspaceId: "workspace_test_1",
        conversationId: "conversation-id_test_1",
        postId: "post-id_test_1",
      },
    },
    response: unlinkPostFromConversationFixture.ok(),
    viewer: { kind: "anonymous" },
    takesViewer: true,
    invalidates: [
      quillsOperationKey(
        "workspace_test_1",
        { kind: "anonymous" },
        "team",
        "getLinkedPostsForConversation",
      ),
    ],
  });
});
