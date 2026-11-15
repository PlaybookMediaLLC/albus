import { describe } from "vite-plus/test";
import { describeHookContract } from "../../test/contracts";
import { quillsOperationKey } from "../../api/keys";
import { setDefaultSlaPolicyFixture } from "../../api/team/set-default-sla-policy.fixture";
import { useSetDefaultSlaPolicy } from "./use-set-default-sla-policy";
describe("useSetDefaultSlaPolicy", () => {
  describeHookContract({
    kind: "mutation",
    hook: useSetDefaultSlaPolicy,
    operationId: "setQuillsDefaultSlaPolicy",
    request: {
      param: { workspaceId: "workspace_test_1" },
      json: { policyId: null },
    },
    response: setDefaultSlaPolicyFixture.ok(),
    viewer: { kind: "anonymous" },
    takesViewer: true,
    invalidates: [
      quillsOperationKey(
        "workspace_test_1",
        { kind: "anonymous" },
        "team",
        "getDefaultSlaPolicy",
      ),
    ],
  });
});
