import { describe } from "vite-plus/test";
import { describeOperationContract } from "../../test/contracts";
import { startHubspotOAuthConnect } from "./start-hubspot-oauth-connect";
import { startHubspotOAuthConnectFixture } from "./start-hubspot-oauth-connect.fixture";
describe("startHubspotOAuthConnect", () => {
  describeOperationContract({
    operationId: "startQuillsHubspotOAuthConnect",
    operation: startHubspotOAuthConnect,
    request: { param: { workspaceId: "workspace_test_1" } },
    response: startHubspotOAuthConnectFixture.ok(),
    method: "get",
    path: "/api/quills/workspace_test_1/oauth/hubspot/connect",
    statuses: [401, 403, 409, 429],
  });
});
