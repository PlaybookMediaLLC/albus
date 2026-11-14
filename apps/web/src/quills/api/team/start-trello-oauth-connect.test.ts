import { describe } from "vite-plus/test";
import { describeOperationContract } from "../../test/contracts";
import { startTrelloOAuthConnect } from "./start-trello-oauth-connect";
import { startTrelloOAuthConnectFixture } from "./start-trello-oauth-connect.fixture";
describe("startTrelloOAuthConnect", () => {
  describeOperationContract({
    operationId: "startQuillsTrelloOAuthConnect",
    operation: startTrelloOAuthConnect,
    request: { param: { workspaceId: "workspace_test_1" } },
    response: startTrelloOAuthConnectFixture.ok(),
    method: "get",
    path: "/api/quills/workspace_test_1/oauth/trello/connect",
    statuses: [401, 403, 409, 429],
  });
});
