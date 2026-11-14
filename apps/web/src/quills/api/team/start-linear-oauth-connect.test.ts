import { describe } from "vite-plus/test";
import { describeOperationContract } from "../../test/contracts";
import { startLinearOAuthConnect } from "./start-linear-oauth-connect";
import { startLinearOAuthConnectFixture } from "./start-linear-oauth-connect.fixture";
describe("startLinearOAuthConnect", () => {
  describeOperationContract({
    operationId: "startQuillsLinearOAuthConnect",
    operation: startLinearOAuthConnect,
    request: { param: { workspaceId: "workspace_test_1" } },
    response: startLinearOAuthConnectFixture.ok(),
    method: "get",
    path: "/api/quills/workspace_test_1/oauth/linear/connect",
    statuses: [401, 403, 409, 429],
  });
});
