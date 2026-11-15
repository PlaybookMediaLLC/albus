import { describe } from "vite-plus/test";
import { describeOperationContract } from "../../test/contracts";
import { createSettingsUpload } from "./create-settings-upload";
import { createSettingsUploadFixture } from "./create-settings-upload.fixture";
describe("createSettingsUpload", () => {
  describeOperationContract({
    operationId: "createQuillsSettingsUpload",
    operation: createSettingsUpload,
    request: {
      param: { workspaceId: "workspace_test_1" },
      json: {
        purpose: "logo",
        filename: "value",
        contentType: "value",
        size: 0,
      },
    },
    response: createSettingsUploadFixture.ok(),
    method: "post",
    path: "/api/quills/workspace_test_1/files/settings-uploads",
    statuses: [401, 403, 429],
  });
});
