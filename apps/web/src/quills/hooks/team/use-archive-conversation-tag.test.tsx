import { describe } from "vite-plus/test";
import { describeHookContract } from "../../test/contracts";
import { quillsOperationKey } from "../../api/keys";
import { archiveConversationTagFixture } from "../../api/team/archive-conversation-tag.fixture";
import { useArchiveConversationTag } from "./use-archive-conversation-tag";
describe("useArchiveConversationTag", () => {
  describeHookContract({
    kind: "mutation",
    hook: useArchiveConversationTag,
    operationId: "archiveQuillsConversationTag",
    request: {
      param: { workspaceId: "workspace_test_1", tagId: "tag-id_test_1" },
    },
    response: archiveConversationTagFixture.ok(),
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
