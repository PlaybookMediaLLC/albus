import { describe } from "vite-plus/test";
import { describeHookContract } from "../../test/contracts";
import { quillsOperationKey } from "../../api/keys";
import { answerKnowledgeSuggestionFixture } from "../../api/team/answer-knowledge-suggestion.fixture";
import { useAnswerKnowledgeSuggestion } from "./use-answer-knowledge-suggestion";
describe("useAnswerKnowledgeSuggestion", () => {
  describeHookContract({
    kind: "mutation",
    hook: useAnswerKnowledgeSuggestion,
    operationId: "answerQuillsKnowledgeSuggestion",
    request: {
      param: {
        workspaceId: "workspace_test_1",
        suggestionId: "suggestion-id_test_1",
      },
      json: {},
    },
    response: answerKnowledgeSuggestionFixture.ok(),
    viewer: { kind: "anonymous" },
    takesViewer: true,
    invalidates: [
      quillsOperationKey(
        "workspace_test_1",
        { kind: "anonymous" },
        "team",
        "listKnowledgeSuggestions",
      ),
      quillsOperationKey(
        "workspace_test_1",
        { kind: "anonymous" },
        "team",
        "getKnowledgeSuggestion",
      ),
    ],
  });
});
