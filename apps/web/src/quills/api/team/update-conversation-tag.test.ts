import { describe } from "vite-plus/test";
import { describeOperationContract } from "../../test/contracts";
import { updateConversationTag } from "./update-conversation-tag";
import { updateConversationTagFixture } from "./update-conversation-tag.fixture";
describe("updateConversationTag", () => {
  describeOperationContract({
    operationId: "updateQuillsConversationTag",
    operation: updateConversationTag,
    request: {
      param: { workspaceId: "workspace_test_1", tagId: "tag-id_test_1" },
      json: {},
    },
    response: updateConversationTagFixture.ok(),
    method: "patch",
    path: "/api/quills/workspace_test_1/conversation-tags/tag-id_test_1",
    statuses: [401, 403, 404, 409, 429],
  });
});
