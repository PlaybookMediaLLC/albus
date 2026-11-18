import { describe } from "vite-plus/test";
import { describeOperationContract } from "../../test/contracts";
import { dismissKnowledgeSuggestion } from "./dismiss-knowledge-suggestion";
import { dismissKnowledgeSuggestionFixture } from "./dismiss-knowledge-suggestion.fixture";
describe("dismissKnowledgeSuggestion", () => {
  describeOperationContract({
    operationId: "dismissQuillsKnowledgeSuggestion",
    operation: dismissKnowledgeSuggestion,
    request: {
      param: {
        workspaceId: "workspace_test_1",
        suggestionId: "suggestion-id_test_1",
      },
    },
    response: dismissKnowledgeSuggestionFixture.ok(),
    method: "post",
    path: "/api/quills/workspace_test_1/assistant/knowledge-suggestions/suggestion-id_test_1/dismiss",
    statuses: [401, 403, 404, 409, 429],
  });
});
