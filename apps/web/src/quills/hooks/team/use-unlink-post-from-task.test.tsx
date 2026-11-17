import { describe } from "vite-plus/test";
import { describeHookContract } from "../../test/contracts";
import { quillsOperationKey } from "../../api/keys";
import { unlinkPostFromTaskFixture } from "../../api/team/unlink-post-from-task.fixture";
import { useUnlinkPostFromTask } from "./use-unlink-post-from-task";
describe("useUnlinkPostFromTask", () => {
  describeHookContract({
    kind: "mutation",
    hook: useUnlinkPostFromTask,
    operationId: "unlinkQuillsPostFromTask",
    request: {
      param: {
        workspaceId: "workspace_test_1",
        postId: "post-id_test_1",
        taskId: "task-id_test_1",
      },
    },
    response: unlinkPostFromTaskFixture.ok(),
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
