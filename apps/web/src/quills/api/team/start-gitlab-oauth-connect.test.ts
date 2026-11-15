import { describe } from "vite-plus/test";
import { describeOperationContract } from "../../test/contracts";
import { startGitlabOAuthConnect } from "./start-gitlab-oauth-connect";
import { startGitlabOAuthConnectFixture } from "./start-gitlab-oauth-connect.fixture";
describe("startGitlabOAuthConnect", () => {
  describeOperationContract({
    operationId: "startQuillsGitlabOAuthConnect",
    operation: startGitlabOAuthConnect,
    request: { param: { workspaceId: "workspace_test_1" } },
    response: startGitlabOAuthConnectFixture.ok(),
    method: "get",
    path: "/api/quills/workspace_test_1/oauth/gitlab/connect",
    statuses: [401, 403, 409, 429],
  });
});
