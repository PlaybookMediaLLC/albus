import { describe } from "vite-plus/test";
import { describeOperationContract } from "../../test/contracts";
import { saveZapierWebhook } from "./save-zapier-webhook";
import { saveZapierWebhookFixture } from "./save-zapier-webhook.fixture";
describe("saveZapierWebhook", () => {
  describeOperationContract({
    operationId: "saveQuillsZapierWebhook",
    operation: saveZapierWebhook,
    request: {
      param: { workspaceId: "workspace_test_1" },
      json: { webhookUrl: "value" },
    },
    response: saveZapierWebhookFixture.ok(),
    method: "put",
    path: "/api/quills/workspace_test_1/integrations/zapier/connection",
    statuses: [401, 403, 409, 429],
  });
});
