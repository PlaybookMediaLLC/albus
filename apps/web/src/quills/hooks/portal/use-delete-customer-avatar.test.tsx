import { describe } from "vite-plus/test";
import { describeHookContract } from "../../test/contracts";
import { quillsOperationKey } from "../../api/keys";
import { deleteCustomerAvatarFixture } from "../../api/portal/delete-customer-avatar.fixture";
import { useDeleteCustomerAvatar } from "./use-delete-customer-avatar";
describe("useDeleteCustomerAvatar", () => {
  describeHookContract({
    kind: "mutation",
    hook: useDeleteCustomerAvatar,
    operationId: "deleteQuillsCustomerAvatar",
    request: { param: { workspace: "workspace_test_1" } },
    response: deleteCustomerAvatarFixture.ok(),
    viewer: { kind: "anonymous" },
    takesViewer: true,
    invalidates: [
      quillsOperationKey(
        "workspace_test_1",
        { kind: "anonymous" },
        "portal",
        "getCustomerProfile",
      ),
    ],
  });
});
