import { describe } from "vite-plus/test";
import { describeHookContract } from "../../test/contracts";
import { getKnowledgeSuggestionFixture } from "../../api/team/get-knowledge-suggestion.fixture";
import { useGetKnowledgeSuggestion } from "./use-get-knowledge-suggestion";
describe("useGetKnowledgeSuggestion", () => {
  describeHookContract({
    kind: "query",
    hook: useGetKnowledgeSuggestion,
    operationId: "getQuillsKnowledgeSuggestion",
    request: {
      param: {
        workspaceId: "workspace_test_1",
        suggestionId: "suggestion-id_test_1",
      },
    },
    emptyRequest: {
      param: { workspaceId: "", suggestionId: "suggestion-id_test_1" },
    },
    response: getKnowledgeSuggestionFixture.ok(),
    viewer: { kind: "anonymous" },
    takesViewer: false,
    invalidates: [],
  });
});
