import { describe } from "vite-plus/test";
import { describeOperationContract } from "../../test/contracts";
import { startMondayOAuthConnect } from "./start-monday-oauth-connect";
import { startMondayOAuthConnectFixture } from "./start-monday-oauth-connect.fixture";
describe("startMondayOAuthConnect", () => {
  describeOperationContract({
    operationId: "startQuillsMondayOAuthConnect",
    operation: startMondayOAuthConnect,
    request: { param: { workspaceId: "workspace_test_1" } },
    response: startMondayOAuthConnectFixture.ok(),
    method: "get",
    path: "/api/quills/workspace_test_1/oauth/monday/connect",
    statuses: [401, 403, 409, 429],
  });
});
