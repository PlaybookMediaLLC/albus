import { describe } from "vite-plus/test";
import { describeOperationContract } from "../../test/contracts";
import { linkPostToTask } from "./link-post-to-task";
import { linkPostToTaskFixture } from "./link-post-to-task.fixture";
describe("linkPostToTask", () => {
  describeOperationContract({
    operationId: "linkQuillsPostToTask",
    operation: linkPostToTask,
    request: {
      param: {
        workspaceId: "workspace_test_1",
        postId: "post-id_test_1",
        taskId: "task-id_test_1",
      },
    },
    response: linkPostToTaskFixture.ok(),
    method: "put",
    path: "/api/quills/workspace_test_1/posts/post-id_test_1/tasks/task-id_test_1",
    statuses: [401, 403, 404, 429],
  });
});
