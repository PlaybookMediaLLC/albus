import { describe } from "vite-plus/test";
import { describeOperationContract } from "../../test/contracts";
import { answerKnowledgeSuggestion } from "./answer-knowledge-suggestion";
import { answerKnowledgeSuggestionFixture } from "./answer-knowledge-suggestion.fixture";
describe("answerKnowledgeSuggestion", () => {
  describeOperationContract({
    operationId: "answerQuillsKnowledgeSuggestion",
    operation: answerKnowledgeSuggestion,
    request: {
      param: {
        workspaceId: "workspace_test_1",
        suggestionId: "suggestion-id_test_1",
      },
      json: {},
    },
    response: answerKnowledgeSuggestionFixture.ok(),
    method: "post",
    path: "/api/quills/workspace_test_1/assistant/knowledge-suggestions/suggestion-id_test_1/answer",
    statuses: [401, 403, 404, 409, 429],
  });
});
