import { describe } from "vite-plus/test";
import { describeOperationContract } from "../../test/contracts";
import { deleteConversationTag } from "./delete-conversation-tag";
import { deleteConversationTagFixture } from "./delete-conversation-tag.fixture";
describe("deleteConversationTag", () => {
  describeOperationContract({
    operationId: "deleteQuillsConversationTag",
    operation: deleteConversationTag,
    request: {
      param: { workspaceId: "workspace_test_1", tagId: "tag-id_test_1" },
    },
    response: deleteConversationTagFixture.ok(),
    method: "delete",
    path: "/api/quills/workspace_test_1/conversation-tags/tag-id_test_1/permanent",
    statuses: [401, 403, 404, 409, 429],
  });
});
