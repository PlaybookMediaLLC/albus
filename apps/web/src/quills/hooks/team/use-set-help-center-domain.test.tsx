import { describe } from "vite-plus/test";
import { describeHookContract } from "../../test/contracts";
import { quillsOperationKey } from "../../api/keys";
import { setHelpCenterDomainFixture } from "../../api/team/set-help-center-domain.fixture";
import { useSetHelpCenterDomain } from "./use-set-help-center-domain";
describe("useSetHelpCenterDomain", () => {
  describeHookContract({
    kind: "mutation",
    hook: useSetHelpCenterDomain,
    operationId: "setQuillsHelpCenterDomain",
    request: {
      param: { workspaceId: "workspace_test_1" },
      json: { domain: "value" },
    },
    response: setHelpCenterDomainFixture.ok(),
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
