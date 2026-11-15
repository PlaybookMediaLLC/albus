import { describe } from "vite-plus/test";
import { describeHookContract } from "../../test/contracts";
import { quillsOperationKey } from "../../api/keys";
import { verifyPortalDomainFixture } from "../../api/team/verify-portal-domain.fixture";
import { useVerifyPortalDomain } from "./use-verify-portal-domain";
describe("useVerifyPortalDomain", () => {
  describeHookContract({
    kind: "mutation",
    hook: useVerifyPortalDomain,
    operationId: "verifyQuillsPortalDomain",
    request: { param: { workspaceId: "workspace_test_1" } },
    response: verifyPortalDomainFixture.ok(),
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
