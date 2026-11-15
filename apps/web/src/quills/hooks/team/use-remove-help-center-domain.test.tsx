import { describe } from "vite-plus/test";
import { describeHookContract } from "../../test/contracts";
import { quillsOperationKey } from "../../api/keys";
import { removeHelpCenterDomainFixture } from "../../api/team/remove-help-center-domain.fixture";
import { useRemoveHelpCenterDomain } from "./use-remove-help-center-domain";
describe("useRemoveHelpCenterDomain", () => {
  describeHookContract({
    kind: "mutation",
    hook: useRemoveHelpCenterDomain,
    operationId: "removeQuillsHelpCenterDomain",
    request: { param: { workspaceId: "workspace_test_1" } },
    response: removeHelpCenterDomainFixture.ok(),
    viewer: { kind: "anonymous" },
    takesViewer: true,
    invalidates: [
      quillsOperationKey(
        "workspace_test_1",
        { kind: "anonymous" },
        "team",
        "listCustomDomains",
      ),
    ],
  });
});
