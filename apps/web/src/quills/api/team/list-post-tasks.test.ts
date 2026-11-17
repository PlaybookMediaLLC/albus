import { describe } from "vite-plus/test";
import { describeOperationContract } from "../../test/contracts";
import { listPostTasks } from "./list-post-tasks";
import { listPostTasksFixture } from "./list-post-tasks.fixture";
describe("listPostTasks", () => {
  describeOperationContract({
    operationId: "listQuillsPostTasks",
    operation: listPostTasks,
    request: {
      param: { workspaceId: "workspace_test_1", postId: "post-id_test_1" },
    },
    response: listPostTasksFixture.ok(),
    method: "get",
    path: "/api/quills/workspace_test_1/posts/post-id_test_1/tasks",
    statuses: [401, 403, 404, 429],
  });
});
