import { describe } from "vite-plus/test";
import { describeHookContract } from "../../test/contracts";
import { listPostTasksFixture } from "../../api/team/list-post-tasks.fixture";
import { useListPostTasks } from "./use-list-post-tasks";
describe("useListPostTasks", () => {
  describeHookContract({
    kind: "query",
    hook: useListPostTasks,
    operationId: "listQuillsPostTasks",
    request: {
      param: { workspaceId: "workspace_test_1", postId: "post-id_test_1" },
    },
    emptyRequest: { param: { workspaceId: "", postId: "post-id_test_1" } },
    response: listPostTasksFixture.ok(),
    viewer: { kind: "anonymous" },
    takesViewer: false,
    invalidates: [],
  });
});
