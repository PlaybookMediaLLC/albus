import { describe } from "vite-plus/test";
import { describeHookContract } from "../../test/contracts";
import { quillsOperationKey } from "../../api/keys";
import { deleteUserFixture } from "../../api/team/delete-user.fixture";
import { useDeleteUser } from "./use-delete-user";
describe("useDeleteUser", () => {
  describeHookContract({
    kind: "mutation",
    hook: useDeleteUser,
    operationId: "deleteQuillsUser",
    request: {
      param: {
        workspaceId: "workspace_test_1",
        principalId: "principal-id_test_1",
      },
    },
    response: deleteUserFixture.ok(),
    viewer: { kind: "anonymous" },
    takesViewer: true,
    invalidates: [
      quillsOperationKey(
        "workspace_test_1",
        { kind: "anonymous" },
        "team",
        "listUsers",
      ),
    ],
  });
});
