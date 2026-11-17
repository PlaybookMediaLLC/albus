import { describe } from "vite-plus/test";
import { describeHookContract } from "../../test/contracts";
import { previewPostUpdateFixture } from "../../api/team/preview-post-update.fixture";
import { usePreviewPostUpdate } from "./use-preview-post-update";
describe("usePreviewPostUpdate", () => {
  describeHookContract({
    kind: "mutation",
    hook: usePreviewPostUpdate,
    operationId: "previewQuillsPostUpdate",
    request: {
      param: { workspaceId: "workspace_test_1", postId: "post-id_test_1" },
      json: {
        channels: {
          page: false,
          email: false,
          conversations: false,
          slack: false,
        },
      },
    },
    response: previewPostUpdateFixture.ok(),
    viewer: { kind: "anonymous" },
    takesViewer: false,
    invalidates: [],
  });
});
