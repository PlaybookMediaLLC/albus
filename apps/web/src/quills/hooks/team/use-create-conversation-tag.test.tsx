import { describe } from "vite-plus/test";
import { describeHookContract } from "../../test/contracts";
import { quillsOperationKey } from "../../api/keys";
import { createConversationTagFixture } from "../../api/team/create-conversation-tag.fixture";
import { useCreateConversationTag } from "./use-create-conversation-tag";
describe("useCreateConversationTag", () => {
  describeHookContract({
    kind: "mutation",
    hook: useCreateConversationTag,
    operationId: "createQuillsConversationTag",
    request: {
      param: { workspaceId: "workspace_test_1" },
      json: { name: "value" },
    },
    response: createConversationTagFixture.ok(),
    viewer: { kind: "anonymous" },
    takesViewer: true,
    invalidates: [
      quillsOperationKey(
        "workspace_test_1",
        { kind: "anonymous" },
        "team",
        "listConversationTags",
      ),
    ],
  });
});
