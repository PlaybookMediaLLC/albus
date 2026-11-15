import { describe } from "vite-plus/test";
import { describeOperationContract } from "../../test/contracts";
import { startSlackOAuthConnect } from "./start-slack-oauth-connect";
import { startSlackOAuthConnectFixture } from "./start-slack-oauth-connect.fixture";
describe("startSlackOAuthConnect", () => {
  describeOperationContract({
    operationId: "startQuillsSlackOAuthConnect",
    operation: startSlackOAuthConnect,
    request: { param: { workspaceId: "workspace_test_1" } },
    response: startSlackOAuthConnectFixture.ok(),
    method: "get",
    path: "/api/quills/workspace_test_1/oauth/slack/connect",
    statuses: [401, 403, 409, 429],
  });
});
