import { describe } from "vite-plus/test";
import { describeHookContract } from "../../test/contracts";
import { quillsOperationKey } from "../../api/keys";
import { setConversationRoutingFixture } from "../../api/team/set-conversation-routing.fixture";
import { useSetConversationRouting } from "./use-set-conversation-routing";
describe("useSetConversationRouting", () => {
  describeHookContract({
    kind: "mutation",
    hook: useSetConversationRouting,
    operationId: "setQuillsConversationRouting",
    request: {
      param: { workspaceId: "workspace_test_1" },
      json: { enabled: false, strategy: "auto_assign_active" },
    },
    response: setConversationRoutingFixture.ok(),
    viewer: { kind: "anonymous" },
    takesViewer: true,
    invalidates: [
      quillsOperationKey(
        "workspace_test_1",
        { kind: "anonymous" },
        "team",
        "getConversationRouting",
      ),
    ],
  });
});
