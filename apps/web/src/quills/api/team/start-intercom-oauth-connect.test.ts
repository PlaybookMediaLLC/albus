import { describe } from "vite-plus/test";
import { describeOperationContract } from "../../test/contracts";
import { startIntercomOAuthConnect } from "./start-intercom-oauth-connect";
import { startIntercomOAuthConnectFixture } from "./start-intercom-oauth-connect.fixture";
describe("startIntercomOAuthConnect", () => {
  describeOperationContract({
    operationId: "startQuillsIntercomOAuthConnect",
    operation: startIntercomOAuthConnect,
    request: { param: { workspaceId: "workspace_test_1" } },
    response: startIntercomOAuthConnectFixture.ok(),
    method: "get",
    path: "/api/quills/workspace_test_1/oauth/intercom/connect",
    statuses: [401, 403, 409, 429],
  });
});
