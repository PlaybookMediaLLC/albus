import { describe } from "vite-plus/test";
import { describeHookContract } from "../../test/contracts";
import { quillsOperationKey } from "../../api/keys";
import { saveCustomerAvatarFixture } from "../../api/portal/save-customer-avatar.fixture";
import { useSaveCustomerAvatar } from "./use-save-customer-avatar";
describe("useSaveCustomerAvatar", () => {
  describeHookContract({
    kind: "mutation",
    hook: useSaveCustomerAvatar,
    operationId: "saveQuillsCustomerAvatar",
    request: {
      param: { workspace: "workspace_test_1" },
      json: { key: "value", contentType: "value", size: 0 },
    },
    response: saveCustomerAvatarFixture.ok(),
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
