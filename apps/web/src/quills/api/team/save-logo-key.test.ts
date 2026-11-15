import { describe } from "vite-plus/test";
import { describeOperationContract } from "../../test/contracts";
import { saveLogoKey } from "./save-logo-key";
import { saveLogoKeyFixture } from "./save-logo-key.fixture";
describe("saveLogoKey", () => {
  describeOperationContract({
    operationId: "saveQuillsLogoKey",
    operation: saveLogoKey,
    request: {
      param: { workspaceId: "workspace_test_1" },
      json: { key: "value", contentType: "value", size: 0 },
    },
    response: saveLogoKeyFixture.ok(),
    method: "put",
    path: "/api/quills/workspace_test_1/settings/logo",
    statuses: [401, 403, 404, 429],
  });
});
