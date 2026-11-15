import { describe } from "vite-plus/test";
import { describeOperationContract } from "../../test/contracts";
import { archiveConversationTag } from "./archive-conversation-tag";
import { archiveConversationTagFixture } from "./archive-conversation-tag.fixture";
describe("archiveConversationTag", () => {
  describeOperationContract({
    operationId: "archiveQuillsConversationTag",
    operation: archiveConversationTag,
    request: {
      param: { workspaceId: "workspace_test_1", tagId: "tag-id_test_1" },
    },
    response: archiveConversationTagFixture.ok(),
    method: "delete",
    path: "/api/quills/workspace_test_1/conversation-tags/tag-id_test_1",
    statuses: [401, 403, 404, 409, 429],
  });
});
