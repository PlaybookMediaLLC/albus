import { describe } from "vite-plus/test";
import { describeOperationContract } from "../../test/contracts";
import { deleteIntegration } from "./delete-integration";
import { deleteIntegrationFixture } from "./delete-integration.fixture";
describe("deleteIntegration", () => {
  describeOperationContract({
    operationId: "deleteQuillsIntegration",
    operation: deleteIntegration,
    request: {
      param: {
        workspaceId: "workspace_test_1",
        integrationId: "integration-id_test_1",
      },
    },
    response: deleteIntegrationFixture.ok(),
    method: "delete",
    path: "/api/quills/workspace_test_1/integrations/integration-id_test_1",
    statuses: [401, 403, 404, 429],
  });
});
