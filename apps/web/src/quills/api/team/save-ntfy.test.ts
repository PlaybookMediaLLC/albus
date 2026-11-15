import { describe } from "vite-plus/test";
import { describeOperationContract } from "../../test/contracts";
import { saveNtfy } from "./save-ntfy";
import { saveNtfyFixture } from "./save-ntfy.fixture";
describe("saveNtfy", () => {
  describeOperationContract({
    operationId: "saveQuillsNtfy",
    operation: saveNtfy,
    request: {
      param: { workspaceId: "workspace_test_1" },
      json: { url: "value" },
    },
    response: saveNtfyFixture.ok(),
    method: "put",
    path: "/api/quills/workspace_test_1/integrations/ntfy/connection",
    statuses: [401, 403, 409, 429],
  });
});
