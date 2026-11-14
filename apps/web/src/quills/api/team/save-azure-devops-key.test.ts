import { describe } from "vite-plus/test";
import { describeOperationContract } from "../../test/contracts";
import { saveAzureDevopsKey } from "./save-azure-devops-key";
import { saveAzureDevopsKeyFixture } from "./save-azure-devops-key.fixture";
describe("saveAzureDevopsKey", () => {
  describeOperationContract({
    operationId: "saveQuillsAzureDevopsKey",
    operation: saveAzureDevopsKey,
    request: {
      param: { workspaceId: "workspace_test_1" },
      json: { token: "mail_link_value", organization: "value" },
    },
    response: saveAzureDevopsKeyFixture.ok(),
    method: "put",
    path: "/api/quills/workspace_test_1/integrations/azure-devops/connection",
    statuses: [400, 401, 403, 409, 429, 502],
  });
});
