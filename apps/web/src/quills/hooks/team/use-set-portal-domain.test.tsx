import { describe } from "vite-plus/test";
import { describeHookContract } from "../../test/contracts";
import { quillsOperationKey } from "../../api/keys";
import { setPortalDomainFixture } from "../../api/team/set-portal-domain.fixture";
import { useSetPortalDomain } from "./use-set-portal-domain";
describe("useSetPortalDomain", () => {
  describeHookContract({
    kind: "mutation",
    hook: useSetPortalDomain,
    operationId: "setQuillsPortalDomain",
    request: {
      param: { workspaceId: "workspace_test_1" },
      json: { domain: "value" },
    },
    response: setPortalDomainFixture.ok(),
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
