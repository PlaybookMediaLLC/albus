import { describe } from "vite-plus/test";
import { describeOperationContract } from "../../test/contracts";
import { startDiscordOAuthConnect } from "./start-discord-oauth-connect";
import { startDiscordOAuthConnectFixture } from "./start-discord-oauth-connect.fixture";
describe("startDiscordOAuthConnect", () => {
  describeOperationContract({
    operationId: "startQuillsDiscordOAuthConnect",
    operation: startDiscordOAuthConnect,
    request: { param: { workspaceId: "workspace_test_1" } },
    response: startDiscordOAuthConnectFixture.ok(),
    method: "get",
    path: "/api/quills/workspace_test_1/oauth/discord/connect",
    statuses: [401, 403, 409, 429],
  });
});
