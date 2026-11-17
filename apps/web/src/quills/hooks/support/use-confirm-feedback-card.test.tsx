import { describe } from "vite-plus/test";
import { describeHookContract } from "../../test/contracts";
import { quillsOperationKey } from "../../api/keys";
import { confirmFeedbackCardFixture } from "../../api/support/confirm-feedback-card.fixture";
import { useConfirmFeedbackCard } from "./use-confirm-feedback-card";
describe("useConfirmFeedbackCard", () => {
  describeHookContract({
    kind: "mutation",
    hook: useConfirmFeedbackCard,
    operationId: "confirmQuillsFeedbackCard",
    request: {
      param: {
        workspace: "workspace_test_1",
        conversationId: "conversation-id_test_1",
        messageId: "message-id_test_1",
      },
      json: { postId: "post_id_test_1" },
    },
    response: confirmFeedbackCardFixture.ok(),
    viewer: { kind: "anonymous" },
    takesViewer: true,
    invalidates: [
      quillsOperationKey(
        "workspace_test_1",
        { kind: "anonymous" },
        "support",
        "listMyConversationMessages",
      ),
    ],
  });
});
