import { describe } from "vite-plus/test";
import { describeOperationContract } from "../../test/contracts";
import { unlinkPostFromTask } from "./unlink-post-from-task";
import { unlinkPostFromTaskFixture } from "./unlink-post-from-task.fixture";
describe("unlinkPostFromTask", () => {
  describeOperationContract({
    operationId: "unlinkQuillsPostFromTask",
    operation: unlinkPostFromTask,
    request: {
      param: {
        workspaceId: "workspace_test_1",
        postId: "post-id_test_1",
        taskId: "task-id_test_1",
      },
    },
    response: unlinkPostFromTaskFixture.ok(),
    method: "delete",
    path: "/api/quills/workspace_test_1/posts/post-id_test_1/tasks/task-id_test_1",
    statuses: [401, 403, 404, 429],
  });
});
