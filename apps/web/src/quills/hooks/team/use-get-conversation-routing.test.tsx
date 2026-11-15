import { describe } from "vite-plus/test";
import { describeHookContract } from "../../test/contracts";
import { getConversationRoutingFixture } from "../../api/team/get-conversation-routing.fixture";
import { useGetConversationRouting } from "./use-get-conversation-routing";
describe("useGetConversationRouting", () => {
  describeHookContract({
    kind: "query",
    hook: useGetConversationRouting,
    operationId: "getQuillsConversationRouting",
    request: { param: { workspaceId: "workspace_test_1" } },
    emptyRequest: { param: { workspaceId: "" } },
    response: getConversationRoutingFixture.ok(),
    viewer: { kind: "anonymous" },
    takesViewer: false,
    invalidates: [],
  });
});
