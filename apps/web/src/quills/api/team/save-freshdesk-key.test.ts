import { describe } from "vite-plus/test";
import { describeOperationContract } from "../../test/contracts";
import { saveFreshdeskKey } from "./save-freshdesk-key";
import { saveFreshdeskKeyFixture } from "./save-freshdesk-key.fixture";
describe("saveFreshdeskKey", () => {
  describeOperationContract({
    operationId: "saveQuillsFreshdeskKey",
    operation: saveFreshdeskKey,
    request: {
      param: { workspaceId: "workspace_test_1" },
      json: { apiKey: "value", subdomain: "value" },
    },
    response: saveFreshdeskKeyFixture.ok(),
    method: "put",
    path: "/api/quills/workspace_test_1/integrations/freshdesk/connection",
    statuses: [401, 403, 409, 429],
  });
});
