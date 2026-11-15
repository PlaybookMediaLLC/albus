import { describe } from "vite-plus/test";
import { describeOperationContract } from "../../test/contracts";
import { saveN8nWebhook } from "./save-n8n-webhook";
import { saveN8nWebhookFixture } from "./save-n8n-webhook.fixture";
describe("saveN8nWebhook", () => {
  describeOperationContract({
    operationId: "saveQuillsN8nWebhook",
    operation: saveN8nWebhook,
    request: {
      param: { workspaceId: "workspace_test_1" },
      json: { webhookUrl: "value" },
    },
    response: saveN8nWebhookFixture.ok(),
    method: "put",
    path: "/api/quills/workspace_test_1/integrations/n8n/connection",
    statuses: [401, 403, 409, 429],
  });
});
