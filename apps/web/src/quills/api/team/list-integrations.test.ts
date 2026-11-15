import { describe } from "vite-plus/test";
import { describeOperationContract } from "../../test/contracts";
import { listIntegrations } from "./list-integrations";
import { listIntegrationsFixture } from "./list-integrations.fixture";
describe("listIntegrations", () => {
  describeOperationContract({
    operationId: "listQuillsIntegrations",
    operation: listIntegrations,
    request: { param: { workspaceId: "workspace_test_1" } },
    response: listIntegrationsFixture.ok(),
    method: "get",
    path: "/api/quills/workspace_test_1/integrations",
    statuses: [401, 403, 429],
  });
});
