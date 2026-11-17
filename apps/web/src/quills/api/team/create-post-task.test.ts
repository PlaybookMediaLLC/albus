import { describe } from "vite-plus/test";
import { describeOperationContract } from "../../test/contracts";
import { createPostTask } from "./create-post-task";
import { createPostTaskFixture } from "./create-post-task.fixture";
describe("createPostTask", () => {
  describeOperationContract({
    operationId: "createQuillsPostTask",
    operation: createPostTask,
    request: {
      param: { workspaceId: "workspace_test_1", postId: "post-id_test_1" },
      json: { projectId: "project_id_test_1" },
    },
    response: createPostTaskFixture.ok(),
    method: "post",
    path: "/api/quills/workspace_test_1/posts/post-id_test_1/tasks",
    statuses: [400, 401, 403, 404, 409, 429],
  });
});
