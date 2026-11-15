import { describe } from "vite-plus/test";
import { describeHookContract } from "../../test/contracts";
import { listIntegrationsFixture } from "../../api/team/list-integrations.fixture";
import { useListIntegrations } from "./use-list-integrations";
describe("useListIntegrations", () => {
  describeHookContract({
    kind: "query",
    hook: useListIntegrations,
    operationId: "listQuillsIntegrations",
    request: { param: { workspaceId: "workspace_test_1" } },
    emptyRequest: { param: { workspaceId: "" } },
    response: listIntegrationsFixture.ok(),
    viewer: { kind: "anonymous" },
    takesViewer: false,
    invalidates: [],
  });
});
