import { describe } from "vite-plus/test";
import { describeHookContract } from "../../test/contracts";
import { quillsOperationKey } from "../../api/keys";
import { createPostTaskFixture } from "../../api/team/create-post-task.fixture";
import { useCreatePostTask } from "./use-create-post-task";
describe("useCreatePostTask", () => {
  describeHookContract({
    kind: "mutation",
    hook: useCreatePostTask,
    operationId: "createQuillsPostTask",
    request: {
      param: { workspaceId: "workspace_test_1", postId: "post-id_test_1" },
      json: { projectId: "project_id_test_1" },
    },
    response: createPostTaskFixture.ok(),
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
