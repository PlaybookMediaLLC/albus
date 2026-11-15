import { describe } from "vite-plus/test";
import { describeOperationContract } from "../../test/contracts";
import { saveMakeWebhook } from "./save-make-webhook";
import { saveMakeWebhookFixture } from "./save-make-webhook.fixture";
describe("saveMakeWebhook", () => {
  describeOperationContract({
    operationId: "saveQuillsMakeWebhook",
    operation: saveMakeWebhook,
    request: {
      param: { workspaceId: "workspace_test_1" },
      json: { webhookUrl: "value" },
    },
    response: saveMakeWebhookFixture.ok(),
    method: "put",
    path: "/api/quills/workspace_test_1/integrations/make/connection",
    statuses: [401, 403, 409, 429],
  });
});
