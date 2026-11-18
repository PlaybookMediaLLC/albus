import { describe } from "vite-plus/test";
import { describeOperationContract } from "../../test/contracts";
import { updateKnowledgeSuggestion } from "./update-knowledge-suggestion";
import { updateKnowledgeSuggestionFixture } from "./update-knowledge-suggestion.fixture";
describe("updateKnowledgeSuggestion", () => {
  describeOperationContract({
    operationId: "updateQuillsKnowledgeSuggestion",
    operation: updateKnowledgeSuggestion,
    request: {
      param: {
        workspaceId: "workspace_test_1",
        suggestionId: "suggestion-id_test_1",
      },
      json: {},
    },
    response: updateKnowledgeSuggestionFixture.ok(),
    method: "patch",
    path: "/api/quills/workspace_test_1/assistant/knowledge-suggestions/suggestion-id_test_1",
    statuses: [401, 403, 404, 409, 429],
  });
});
