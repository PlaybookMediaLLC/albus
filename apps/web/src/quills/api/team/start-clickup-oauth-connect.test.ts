import { describe } from "vite-plus/test";
import { describeOperationContract } from "../../test/contracts";
import { startClickupOAuthConnect } from "./start-clickup-oauth-connect";
import { startClickupOAuthConnectFixture } from "./start-clickup-oauth-connect.fixture";
describe("startClickupOAuthConnect", () => {
  describeOperationContract({
    operationId: "startQuillsClickupOAuthConnect",
    operation: startClickupOAuthConnect,
    request: { param: { workspaceId: "workspace_test_1" } },
    response: startClickupOAuthConnectFixture.ok(),
    method: "get",
    path: "/api/quills/workspace_test_1/oauth/clickup/connect",
    statuses: [401, 403, 409, 429],
  });
});
