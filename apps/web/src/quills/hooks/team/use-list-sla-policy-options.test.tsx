import { describe } from "vite-plus/test";
import { describeHookContract } from "../../test/contracts";
import { listSlaPolicyOptionsFixture } from "../../api/team/list-sla-policy-options.fixture";
import { useListSlaPolicyOptions } from "./use-list-sla-policy-options";
describe("useListSlaPolicyOptions", () => {
  describeHookContract({
    kind: "query",
    hook: useListSlaPolicyOptions,
    operationId: "listQuillsSlaPolicyOptions",
    request: { param: { workspaceId: "workspace_test_1" } },
    emptyRequest: { param: { workspaceId: "" } },
    response: listSlaPolicyOptionsFixture.ok(),
    viewer: { kind: "anonymous" },
    takesViewer: false,
    invalidates: [],
  });
});
