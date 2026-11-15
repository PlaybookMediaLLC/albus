import { describe } from "vite-plus/test";
import { describeHookContract } from "../../test/contracts";
import { quillsOperationKey } from "../../api/keys";
import { rejectPostFixture } from "../../api/team/reject-post.fixture";
import { useRejectPost } from "./use-reject-post";
describe("useRejectPost", () => {
  describeHookContract({
    kind: "mutation",
    hook: useRejectPost,
    operationId: "rejectQuillsPost",
    request: {
      param: { workspaceId: "workspace_test_1", postId: "post-id_test_1" },
      json: { reason: "value" },
    },
    response: rejectPostFixture.ok(),
    viewer: { kind: "anonymous" },
    takesViewer: true,
    invalidates: [
      quillsOperationKey(
        "workspace_test_1",
        { kind: "anonymous" },
        "team",
        "listPendingModeration",
      ),
      quillsOperationKey(
        "workspace_test_1",
        { kind: "anonymous" },
        "team",
        "getModerationStatus",
      ),
    ],
  });
});
