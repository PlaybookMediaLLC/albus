import { describe } from "vite-plus/test";
import { describeHookContract } from "../../test/contracts";
import { quillsOperationKey } from "../../api/keys";
import { updateKnowledgeSuggestionFixture } from "../../api/team/update-knowledge-suggestion.fixture";
import { useUpdateKnowledgeSuggestion } from "./use-update-knowledge-suggestion";
describe("useUpdateKnowledgeSuggestion", () => {
  describeHookContract({
    kind: "mutation",
    hook: useUpdateKnowledgeSuggestion,
    operationId: "updateQuillsKnowledgeSuggestion",
    request: {
      param: {
        workspaceId: "workspace_test_1",
        suggestionId: "suggestion-id_test_1",
      },
      json: {},
    },
    response: updateKnowledgeSuggestionFixture.ok(),
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
