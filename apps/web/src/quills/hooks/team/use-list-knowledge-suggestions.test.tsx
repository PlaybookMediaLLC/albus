import { describe } from "vite-plus/test";
import { describeHookContract } from "../../test/contracts";
import { listKnowledgeSuggestionsFixture } from "../../api/team/list-knowledge-suggestions.fixture";
import { useListKnowledgeSuggestions } from "./use-list-knowledge-suggestions";
describe("useListKnowledgeSuggestions", () => {
  describeHookContract({
    kind: "query",
    hook: useListKnowledgeSuggestions,
    operationId: "listQuillsKnowledgeSuggestions",
    request: { param: { workspaceId: "workspace_test_1" } },
    emptyRequest: { param: { workspaceId: "" } },
    response: listKnowledgeSuggestionsFixture.ok(),
    viewer: { kind: "anonymous" },
    takesViewer: false,
    invalidates: [],
  });
});
