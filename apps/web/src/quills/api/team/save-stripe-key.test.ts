import { describe } from "vite-plus/test";
import { describeOperationContract } from "../../test/contracts";
import { saveStripeKey } from "./save-stripe-key";
import { saveStripeKeyFixture } from "./save-stripe-key.fixture";
describe("saveStripeKey", () => {
  describeOperationContract({
    operationId: "saveQuillsStripeKey",
    operation: saveStripeKey,
    request: {
      param: { workspaceId: "workspace_test_1" },
      json: { apiKey: "value" },
    },
    response: saveStripeKeyFixture.ok(),
    method: "put",
    path: "/api/quills/workspace_test_1/integrations/stripe/connection",
    statuses: [401, 403, 409, 429],
  });
});
