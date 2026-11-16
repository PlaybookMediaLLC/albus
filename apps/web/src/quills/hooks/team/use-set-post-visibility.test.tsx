import { describe } from "vite-plus/test";
import { describeHookContract } from "../../test/contracts";
import { quillsOperationKey } from "../../api/keys";
import { setPostVisibilityFixture } from "../../api/team/set-post-visibility.fixture";
import { useSetPostVisibility } from "./use-set-post-visibility";
describe("useSetPostVisibility", () => {
  describeHookContract({
    kind: "mutation",
    hook: useSetPostVisibility,
    operationId: "setQuillsPostVisibility",
    request: {
      param: { workspaceId: "workspace_test_1", postId: "post-id_test_1" },
      json: { visible: false },
    },
    response: setPostVisibilityFixture.ok(),
    viewer: { kind: "anonymous" },
    takesViewer: true,
    invalidates: [
      quillsOperationKey(
        "workspace_test_1",
        { kind: "anonymous" },
        "team",
        "getPost",
      ),
      quillsOperationKey(
        "workspace_test_1",
        { kind: "anonymous" },
        "team",
        "listPosts",
      ),
    ],
  });
});
