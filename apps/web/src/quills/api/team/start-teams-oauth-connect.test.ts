import { describe } from "vite-plus/test";
import { describeOperationContract } from "../../test/contracts";
import { startTeamsOAuthConnect } from "./start-teams-oauth-connect";
import { startTeamsOAuthConnectFixture } from "./start-teams-oauth-connect.fixture";
describe("startTeamsOAuthConnect", () => {
  describeOperationContract({
    operationId: "startQuillsTeamsOAuthConnect",
    operation: startTeamsOAuthConnect,
    request: { param: { workspaceId: "workspace_test_1" } },
    response: startTeamsOAuthConnectFixture.ok(),
    method: "get",
    path: "/api/quills/workspace_test_1/oauth/teams/connect",
    statuses: [401, 403, 409, 429],
  });
});
