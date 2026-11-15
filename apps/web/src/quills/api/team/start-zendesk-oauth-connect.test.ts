import { describe } from "vite-plus/test";
import { describeOperationContract } from "../../test/contracts";
import { startZendeskOAuthConnect } from "./start-zendesk-oauth-connect";
// No fixture file: C16 reads the "zendesk-oauth" in its import path as a token.
describe("startZendeskOAuthConnect", () => {
  describeOperationContract({
    operationId: "startQuillsZendeskOAuthConnect",
    operation: startZendeskOAuthConnect,
    request: {
      param: { workspaceId: "workspace_test_1" },
      query: { subdomain: "value" },
    },
    response: { authorizeUrl: "value" },
    method: "get",
    path: "/api/quills/workspace_test_1/oauth/zendesk/connect",
    statuses: [400, 401, 403, 409, 429],
  });
});
