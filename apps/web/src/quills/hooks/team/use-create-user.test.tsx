import { describe } from "vite-plus/test";
import { describeHookContract } from "../../test/contracts";
import { quillsOperationKey } from "../../api/keys";
import { createUserFixture } from "../../api/team/create-user.fixture";
import { useCreateUser } from "./use-create-user";
describe("useCreateUser", () => {
  describeHookContract({
    kind: "mutation",
    hook: useCreateUser,
    operationId: "createQuillsUser",
    request: {
      param: { workspaceId: "workspace_test_1" },
      json: { name: "value" },
    },
    response: createUserFixture.ok(),
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
