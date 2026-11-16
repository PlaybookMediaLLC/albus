import { describe } from "vite-plus/test";
import { describeHookContract } from "../../test/contracts";
import { quillsOperationKey } from "../../api/keys";
import { createPostViewFixture } from "../../api/team/create-post-view.fixture";
import { useCreatePostView } from "./use-create-post-view";
describe("useCreatePostView", () => {
  describeHookContract({
    kind: "mutation",
    hook: useCreatePostView,
    operationId: "createQuillsPostView",
    request: {
      param: { workspaceId: "workspace_test_1" },
      json: { name: "value", filters: {} },
    },
    response: createPostViewFixture.ok(),
    viewer: { kind: "anonymous" },
    takesViewer: true,
    invalidates: [
      quillsOperationKey(
        "workspace_test_1",
        { kind: "anonymous" },
        "team",
        "listPostViews",
      ),
    ],
  });
});
