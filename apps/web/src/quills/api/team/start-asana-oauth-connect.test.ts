import { describe } from "vite-plus/test";
import { describeOperationContract } from "../../test/contracts";
import { startAsanaOAuthConnect } from "./start-asana-oauth-connect";
import { startAsanaOAuthConnectFixture } from "./start-asana-oauth-connect.fixture";
describe("startAsanaOAuthConnect", () => {
  describeOperationContract({
    operationId: "startQuillsAsanaOAuthConnect",
    operation: startAsanaOAuthConnect,
    request: { param: { workspaceId: "workspace_test_1" } },
    response: startAsanaOAuthConnectFixture.ok(),
    method: "get",
    path: "/api/quills/workspace_test_1/oauth/asana/connect",
    statuses: [401, 403, 409, 429],
  });
});
