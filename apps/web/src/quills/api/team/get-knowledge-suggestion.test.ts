import { describe } from "vite-plus/test";
import { describeOperationContract } from "../../test/contracts";
import { getKnowledgeSuggestion } from "./get-knowledge-suggestion";
import { getKnowledgeSuggestionFixture } from "./get-knowledge-suggestion.fixture";
describe("getKnowledgeSuggestion", () => {
  describeOperationContract({
    operationId: "getQuillsKnowledgeSuggestion",
    operation: getKnowledgeSuggestion,
    request: {
      param: {
        workspaceId: "workspace_test_1",
        suggestionId: "suggestion-id_test_1",
      },
    },
    response: getKnowledgeSuggestionFixture.ok(),
    method: "get",
    path: "/api/quills/workspace_test_1/assistant/knowledge-suggestions/suggestion-id_test_1",
    statuses: [401, 403, 404, 429],
  });
});
