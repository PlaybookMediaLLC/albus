import { describe } from "vite-plus/test";
import { describeHookContract } from "../../test/contracts";
import { listIntegrationCatalogFixture } from "../../api/team/list-integration-catalog.fixture";
import { useListIntegrationCatalog } from "./use-list-integration-catalog";
describe("useListIntegrationCatalog", () => {
  describeHookContract({
    kind: "query",
    hook: useListIntegrationCatalog,
    operationId: "listQuillsIntegrationCatalog",
    request: { param: { workspaceId: "workspace_test_1" } },
    emptyRequest: { param: { workspaceId: "" } },
    response: listIntegrationCatalogFixture.ok(),
    viewer: { kind: "anonymous" },
    takesViewer: false,
    invalidates: [],
  });
});
