import { describe } from "vite-plus/test";
import { describeHookContract } from "../../test/contracts";
import { quillsOperationKey } from "../../api/keys";
import { approveKnowledgeSuggestionFixture } from "../../api/team/approve-knowledge-suggestion.fixture";
import { useApproveKnowledgeSuggestion } from "./use-approve-knowledge-suggestion";
describe("useApproveKnowledgeSuggestion", () => {
  describeHookContract({
    kind: "mutation",
    hook: useApproveKnowledgeSuggestion,
    operationId: "approveQuillsKnowledgeSuggestion",
    request: {
      param: {
        workspaceId: "workspace_test_1",
        suggestionId: "suggestion-id_test_1",
      },
      json: { audience: "public" },
    },
    response: approveKnowledgeSuggestionFixture.ok(),
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
