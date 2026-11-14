import { describe } from "vite-plus/test";
import { describeOperationContract } from "../../test/contracts";
import { startSalesforceOAuthConnect } from "./start-salesforce-oauth-connect";
import { startSalesforceOAuthConnectFixture } from "./start-salesforce-oauth-connect.fixture";
describe("startSalesforceOAuthConnect", () => {
  describeOperationContract({
    operationId: "startQuillsSalesforceOAuthConnect",
    operation: startSalesforceOAuthConnect,
    request: { param: { workspaceId: "workspace_test_1" } },
    response: startSalesforceOAuthConnectFixture.ok(),
    method: "get",
    path: "/api/quills/workspace_test_1/oauth/salesforce/connect",
    statuses: [401, 403, 409, 429],
  });
});
