import { describe } from "vite-plus/test";
import { describeOperationContract } from "../../test/contracts";
import { saveSegmentConnection } from "./save-segment-connection";
import { saveSegmentConnectionFixture } from "./save-segment-connection.fixture";
describe("saveSegmentConnection", () => {
  describeOperationContract({
    operationId: "saveQuillsSegmentConnection",
    operation: saveSegmentConnection,
    request: {
      param: { workspaceId: "workspace_test_1" },
      json: { incomingSecret: "value" },
    },
    response: saveSegmentConnectionFixture.ok(),
    method: "put",
    path: "/api/quills/workspace_test_1/integrations/segment/connection",
    statuses: [401, 403, 409, 429],
  });
});
