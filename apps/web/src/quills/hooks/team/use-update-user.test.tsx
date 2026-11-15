import { describe } from "vite-plus/test";
import { describeHookContract } from "../../test/contracts";
import { quillsOperationKey } from "../../api/keys";
import { updateUserFixture } from "../../api/team/update-user.fixture";
import { useUpdateUser } from "./use-update-user";
describe("useUpdateUser", () => {
  describeHookContract({
    kind: "mutation",
    hook: useUpdateUser,
    operationId: "updateQuillsUser",
    request: {
      param: {
        workspaceId: "workspace_test_1",
        principalId: "principal-id_test_1",
      },
      json: {},
    },
    response: updateUserFixture.ok(),
    viewer: { kind: "anonymous" },
    takesViewer: true,
    invalidates: [
      quillsOperationKey(
        "workspace_test_1",
        { kind: "anonymous" },
        "team",
        "getUser",
      ),
    ],
  });
});
