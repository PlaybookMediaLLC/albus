import { describe } from "vite-plus/test";
import { describeHookContract } from "../../test/contracts";
import { quillsOperationKey } from "../../api/keys";
import { dismissKnowledgeSuggestionFixture } from "../../api/team/dismiss-knowledge-suggestion.fixture";
import { useDismissKnowledgeSuggestion } from "./use-dismiss-knowledge-suggestion";
describe("useDismissKnowledgeSuggestion", () => {
  describeHookContract({
    kind: "mutation",
    hook: useDismissKnowledgeSuggestion,
    operationId: "dismissQuillsKnowledgeSuggestion",
    request: {
      param: {
        workspaceId: "workspace_test_1",
        suggestionId: "suggestion-id_test_1",
      },
    },
    response: dismissKnowledgeSuggestionFixture.ok(),
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
