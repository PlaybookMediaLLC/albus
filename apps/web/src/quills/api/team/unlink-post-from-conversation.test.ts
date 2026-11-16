import { describe } from "vite-plus/test";
import { describeOperationContract } from "../../test/contracts";
import { unlinkPostFromConversation } from "./unlink-post-from-conversation";
import { unlinkPostFromConversationFixture } from "./unlink-post-from-conversation.fixture";
describe("unlinkPostFromConversation", () => {
  describeOperationContract({
    operationId: "unlinkQuillsPostFromConversation",
    operation: unlinkPostFromConversation,
    request: {
      param: {
        workspaceId: "workspace_test_1",
        conversationId: "conversation-id_test_1",
        postId: "post-id_test_1",
      },
    },
    response: unlinkPostFromConversationFixture.ok(),
    method: "delete",
    path: "/api/quills/workspace_test_1/conversations/conversation-id_test_1/posts/post-id_test_1",
    statuses: [401, 403, 404, 409, 429],
  });
});
