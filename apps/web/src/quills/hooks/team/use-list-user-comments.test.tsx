import { describe } from "vite-plus/test";
import { describeHookContract } from "../../test/contracts";
import { listUserCommentsFixture } from "../../api/team/list-user-comments.fixture";
import { useListUserComments } from "./use-list-user-comments";
describe("useListUserComments", () => {
  describeHookContract({
    kind: "query",
    hook: useListUserComments,
    operationId: "listQuillsUserComments",
    request: {
      param: {
        workspaceId: "workspace_test_1",
        principalId: "principal-id_test_1",
      },
    },
    emptyRequest: {
      param: { workspaceId: "", principalId: "principal-id_test_1" },
    },
    response: listUserCommentsFixture.ok(),
    viewer: { kind: "anonymous" },
    takesViewer: false,
    invalidates: [],
    paged: { cursor: "cursor_test_2" },
  });
});
