import { describe } from "vite-plus/test";
import { describeOperationContract } from "../../test/contracts";
import { startGithubOAuthConnect } from "./start-github-oauth-connect";
import { startGithubOAuthConnectFixture } from "./start-github-oauth-connect.fixture";
describe("startGithubOAuthConnect", () => {
  describeOperationContract({
    operationId: "startQuillsGithubOAuthConnect",
    operation: startGithubOAuthConnect,
    request: { param: { workspaceId: "workspace_test_1" } },
    response: startGithubOAuthConnectFixture.ok(),
    method: "get",
    path: "/api/quills/workspace_test_1/oauth/github/connect",
    statuses: [401, 403, 409, 429],
  });
});
