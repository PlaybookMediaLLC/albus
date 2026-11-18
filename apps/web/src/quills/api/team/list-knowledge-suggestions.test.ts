import { describe } from "vite-plus/test";
import { describeOperationContract } from "../../test/contracts";
import { listKnowledgeSuggestions } from "./list-knowledge-suggestions";
import { listKnowledgeSuggestionsFixture } from "./list-knowledge-suggestions.fixture";
describe("listKnowledgeSuggestions", () => {
  describeOperationContract({
    operationId: "listQuillsKnowledgeSuggestions",
    operation: listKnowledgeSuggestions,
    request: { param: { workspaceId: "workspace_test_1" } },
    response: listKnowledgeSuggestionsFixture.ok(),
    method: "get",
    path: "/api/quills/workspace_test_1/assistant/knowledge-suggestions",
    statuses: [401, 403, 429],
  });
});
