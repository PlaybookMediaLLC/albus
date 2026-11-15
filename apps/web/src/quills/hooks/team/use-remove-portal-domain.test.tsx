import { describe } from "vite-plus/test";
import { describeHookContract } from "../../test/contracts";
import { quillsOperationKey } from "../../api/keys";
import { removePortalDomainFixture } from "../../api/team/remove-portal-domain.fixture";
import { useRemovePortalDomain } from "./use-remove-portal-domain";
describe("useRemovePortalDomain", () => {
  describeHookContract({
    kind: "mutation",
    hook: useRemovePortalDomain,
    operationId: "removeQuillsPortalDomain",
    request: { param: { workspaceId: "workspace_test_1" } },
    response: removePortalDomainFixture.ok(),
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
