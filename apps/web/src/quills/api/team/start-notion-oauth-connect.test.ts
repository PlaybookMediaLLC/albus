import { describe } from "vite-plus/test";
import { describeOperationContract } from "../../test/contracts";
import { startNotionOAuthConnect } from "./start-notion-oauth-connect";
import { startNotionOAuthConnectFixture } from "./start-notion-oauth-connect.fixture";
describe("startNotionOAuthConnect", () => {
  describeOperationContract({
    operationId: "startQuillsNotionOAuthConnect",
    operation: startNotionOAuthConnect,
    request: { param: { workspaceId: "workspace_test_1" } },
    response: startNotionOAuthConnectFixture.ok(),
    method: "get",
    path: "/api/quills/workspace_test_1/oauth/notion/connect",
    statuses: [401, 403, 409, 429],
  });
});
