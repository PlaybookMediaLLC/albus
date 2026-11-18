import { describe } from "vite-plus/test";
import { describeOperationContract } from "../../test/contracts";
import { approveKnowledgeSuggestion } from "./approve-knowledge-suggestion";
import { approveKnowledgeSuggestionFixture } from "./approve-knowledge-suggestion.fixture";
describe("approveKnowledgeSuggestion", () => {
  describeOperationContract({
    operationId: "approveQuillsKnowledgeSuggestion",
    operation: approveKnowledgeSuggestion,
    request: {
      param: {
        workspaceId: "workspace_test_1",
        suggestionId: "suggestion-id_test_1",
      },
      json: { audience: "public" },
    },
    response: approveKnowledgeSuggestionFixture.ok(),
    method: "post",
    path: "/api/quills/workspace_test_1/assistant/knowledge-suggestions/suggestion-id_test_1/approve",
    statuses: [401, 403, 404, 409, 429],
  });
});
