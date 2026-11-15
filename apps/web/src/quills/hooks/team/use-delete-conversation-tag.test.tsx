import { describe } from "vite-plus/test";
import { describeHookContract } from "../../test/contracts";
import { quillsOperationKey } from "../../api/keys";
import { deleteConversationTagFixture } from "../../api/team/delete-conversation-tag.fixture";
import { useDeleteConversationTag } from "./use-delete-conversation-tag";
describe("useDeleteConversationTag", () => {
  describeHookContract({
    kind: "mutation",
    hook: useDeleteConversationTag,
    operationId: "deleteQuillsConversationTag",
    request: {
      param: { workspaceId: "workspace_test_1", tagId: "tag-id_test_1" },
    },
    response: deleteConversationTagFixture.ok(),
    viewer: { kind: "anonymous" },
    takesViewer: true,
    invalidates: [
      quillsOperationKey(
        "workspace_test_1",
        { kind: "anonymous" },
        "team",
        "listConversationTags",
      ),
      quillsOperationKey(
        "workspace_test_1",
        { kind: "anonymous" },
        "team",
        "listConversationTagUsage",
      ),
    ],
  });
});
