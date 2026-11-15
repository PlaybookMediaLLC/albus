import { describe } from "vite-plus/test";
import { describeHookContract } from "../../test/contracts";
import { quillsOperationKey } from "../../api/keys";
import { verifyHelpCenterDomainFixture } from "../../api/team/verify-help-center-domain.fixture";
import { useVerifyHelpCenterDomain } from "./use-verify-help-center-domain";
describe("useVerifyHelpCenterDomain", () => {
  describeHookContract({
    kind: "mutation",
    hook: useVerifyHelpCenterDomain,
    operationId: "verifyQuillsHelpCenterDomain",
    request: { param: { workspaceId: "workspace_test_1" } },
    response: verifyHelpCenterDomainFixture.ok(),
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
