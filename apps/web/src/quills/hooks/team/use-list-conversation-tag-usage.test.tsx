import { describe } from "vite-plus/test";
import { describeHookContract } from "../../test/contracts";
import { listConversationTagUsageFixture } from "../../api/team/list-conversation-tag-usage.fixture";
import { useListConversationTagUsage } from "./use-list-conversation-tag-usage";
describe("useListConversationTagUsage", () => {
  describeHookContract({
    kind: "query",
    hook: useListConversationTagUsage,
    operationId: "listQuillsConversationTagUsage",
    request: { param: { workspaceId: "workspace_test_1" } },
    emptyRequest: { param: { workspaceId: "" } },
    response: listConversationTagUsageFixture.ok(),
    viewer: { kind: "anonymous" },
    takesViewer: false,
    invalidates: [],
  });
});
