import { describe } from "vite-plus/test";
import { describeOperationContract } from "../../test/contracts";
import { startJiraOAuthConnect } from "./start-jira-oauth-connect";
import { startJiraOAuthConnectFixture } from "./start-jira-oauth-connect.fixture";
describe("startJiraOAuthConnect", () => {
  describeOperationContract({
    operationId: "startQuillsJiraOAuthConnect",
    operation: startJiraOAuthConnect,
    request: { param: { workspaceId: "workspace_test_1" } },
    response: startJiraOAuthConnectFixture.ok(),
    method: "get",
    path: "/api/quills/workspace_test_1/oauth/jira/connect",
    statuses: [401, 403, 409, 429],
  });
});
