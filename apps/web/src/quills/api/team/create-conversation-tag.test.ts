import { describe } from "vite-plus/test";
import { describeOperationContract } from "../../test/contracts";
import { createConversationTag } from "./create-conversation-tag";
import { createConversationTagFixture } from "./create-conversation-tag.fixture";
describe("createConversationTag", () => {
  describeOperationContract({
    operationId: "createQuillsConversationTag",
    operation: createConversationTag,
    request: {
      param: { workspaceId: "workspace_test_1" },
      json: { name: "value" },
    },
    response: createConversationTagFixture.ok(),
    method: "post",
    path: "/api/quills/workspace_test_1/conversation-tags",
    statuses: [401, 403, 404, 409, 429],
  });
});
