import { describe } from "vite-plus/test";
import { describeHookContract } from "../../test/contracts";
import { quillsOperationKey } from "../../api/keys";
import { restoreConversationTagFixture } from "../../api/team/restore-conversation-tag.fixture";
import { useRestoreConversationTag } from "./use-restore-conversation-tag";
describe("useRestoreConversationTag", () => {
  describeHookContract({
    kind: "mutation",
    hook: useRestoreConversationTag,
    operationId: "restoreQuillsConversationTag",
    request: {
      param: { workspaceId: "workspace_test_1", tagId: "tag-id_test_1" },
    },
    response: restoreConversationTagFixture.ok(),
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
