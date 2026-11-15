import { describe } from "vite-plus/test";
import { describeOperationContract } from "../../test/contracts";
import { restoreConversationTag } from "./restore-conversation-tag";
import { restoreConversationTagFixture } from "./restore-conversation-tag.fixture";
describe("restoreConversationTag", () => {
  describeOperationContract({
    operationId: "restoreQuillsConversationTag",
    operation: restoreConversationTag,
    request: {
      param: { workspaceId: "workspace_test_1", tagId: "tag-id_test_1" },
    },
    response: restoreConversationTagFixture.ok(),
    method: "post",
    path: "/api/quills/workspace_test_1/conversation-tags/tag-id_test_1/restore",
    statuses: [401, 403, 404, 409, 429],
  });
});
