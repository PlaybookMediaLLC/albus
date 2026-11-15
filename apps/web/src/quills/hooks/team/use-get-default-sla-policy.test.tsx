import { describe } from "vite-plus/test";
import { describeHookContract } from "../../test/contracts";
import { getDefaultSlaPolicyFixture } from "../../api/team/get-default-sla-policy.fixture";
import { useGetDefaultSlaPolicy } from "./use-get-default-sla-policy";
describe("useGetDefaultSlaPolicy", () => {
  describeHookContract({
    kind: "query",
    hook: useGetDefaultSlaPolicy,
    operationId: "getQuillsDefaultSlaPolicy",
    request: { param: { workspaceId: "workspace_test_1" } },
    emptyRequest: { param: { workspaceId: "" } },
    response: getDefaultSlaPolicyFixture.ok(),
    viewer: { kind: "anonymous" },
    takesViewer: false,
    invalidates: [],
  });
});
