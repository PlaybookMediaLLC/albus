import { describe } from "vite-plus/test";
import { describeHookContract } from "../../test/contracts";
import { quillsOperationKey } from "../../api/keys";
import { updateConversationTagFixture } from "../../api/team/update-conversation-tag.fixture";
import { useUpdateConversationTag } from "./use-update-conversation-tag";
describe("useUpdateConversationTag", () => {
  describeHookContract({
    kind: "mutation",
    hook: useUpdateConversationTag,
    operationId: "updateQuillsConversationTag",
    request: {
      param: { workspaceId: "workspace_test_1", tagId: "tag-id_test_1" },
      json: {},
    },
    response: updateConversationTagFixture.ok(),
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
