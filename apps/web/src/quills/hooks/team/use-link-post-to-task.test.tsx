import { describe } from "vite-plus/test";
import { describeHookContract } from "../../test/contracts";
import { quillsOperationKey } from "../../api/keys";
import { linkPostToTaskFixture } from "../../api/team/link-post-to-task.fixture";
import { useLinkPostToTask } from "./use-link-post-to-task";
describe("useLinkPostToTask", () => {
  describeHookContract({
    kind: "mutation",
    hook: useLinkPostToTask,
    operationId: "linkQuillsPostToTask",
    request: {
      param: {
        workspaceId: "workspace_test_1",
        postId: "post-id_test_1",
        taskId: "task-id_test_1",
      },
    },
    response: linkPostToTaskFixture.ok(),
    viewer: { kind: "anonymous" },
    takesViewer: true,
    invalidates: [
      quillsOperationKey(
        "workspace_test_1",
        { kind: "anonymous" },
        "team",
        "listPostTasks",
      ),
      quillsOperationKey(
        "workspace_test_1",
        { kind: "anonymous" },
        "team",
        "listLinks",
      ),
    ],
  });
});
