import { describe } from "vite-plus/test";
import { describeHookContract } from "../../test/contracts";
import { quillsOperationKey } from "../../api/keys";
import { sendPostUpdateFixture } from "../../api/team/send-post-update.fixture";
import { useSendPostUpdate } from "./use-send-post-update";
describe("useSendPostUpdate", () => {
  describeHookContract({
    kind: "mutation",
    hook: useSendPostUpdate,
    operationId: "sendQuillsPostUpdate",
    request: {
      param: { workspaceId: "workspace_test_1", postId: "post-id_test_1" },
      json: {
        channels: {
          page: false,
          email: false,
          conversations: false,
          slack: false,
        },
        body: "value",
        idempotencyKey: "value",
      },
    },
    response: sendPostUpdateFixture.ok(),
    viewer: { kind: "anonymous" },
    takesViewer: true,
    invalidates: [
      quillsOperationKey(
        "workspace_test_1",
        { kind: "anonymous" },
        "team",
        "listPostComments",
      ),
      quillsOperationKey(
        "workspace_test_1",
        { kind: "anonymous" },
        "team",
        "getPost",
      ),
    ],
  });
});
