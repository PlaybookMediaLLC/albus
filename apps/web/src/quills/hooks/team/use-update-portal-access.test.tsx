import { describe } from "vite-plus/test";
import { describeHookContract } from "../../test/contracts";
import { quillsOperationKey } from "../../api/keys";
import { updatePortalAccessFixture } from "../../api/team/update-portal-access.fixture";
import { useUpdatePortalAccess } from "./use-update-portal-access";
describe("useUpdatePortalAccess", () => {
  describeHookContract({
    kind: "mutation",
    hook: useUpdatePortalAccess,
    operationId: "updateQuillsPortalAccess",
    request: {
      param: { workspaceId: "workspace_test_1" },
      json: { visibility: "public" },
    },
    response: updatePortalAccessFixture.ok(),
    viewer: { kind: "anonymous" },
    takesViewer: true,
    invalidates: [
      quillsOperationKey(
        "workspace_test_1",
        { kind: "anonymous" },
        "team",
        "getPortalSettings",
      ),
    ],
  });
});
