import { describe } from "vite-plus/test";
import { describeOperationContract } from "../../test/contracts";
import { confirmFeedbackCard } from "./confirm-feedback-card";
import { confirmFeedbackCardFixture } from "./confirm-feedback-card.fixture";
describe("confirmFeedbackCard", () => {
  describeOperationContract({
    operationId: "confirmQuillsFeedbackCard",
    operation: confirmFeedbackCard,
    request: {
      param: {
        workspace: "workspace_test_1",
        conversationId: "conversation-id_test_1",
        messageId: "message-id_test_1",
      },
      json: { postId: "post_id_test_1" },
    },
    response: confirmFeedbackCardFixture.ok(),
    method: "put",
    path: "/api/quills-public/workspace_test_1/support/conversations/conversation-id_test_1/messages/message-id_test_1/feedback-card",
    statuses: [401, 403, 404, 409, 429],
  });
});
