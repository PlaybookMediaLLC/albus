import { describe } from "vite-plus/test";
import { describeOperationContract } from "../../test/contracts";
import { listIntegrationCatalog } from "./list-integration-catalog";
import { listIntegrationCatalogFixture } from "./list-integration-catalog.fixture";
describe("listIntegrationCatalog", () => {
  describeOperationContract({
    operationId: "listQuillsIntegrationCatalog",
    operation: listIntegrationCatalog,
    request: { param: { workspaceId: "workspace_test_1" } },
    response: listIntegrationCatalogFixture.ok(),
    method: "get",
    path: "/api/quills/workspace_test_1/integration-catalog",
    statuses: [401, 403, 429],
  });
});
