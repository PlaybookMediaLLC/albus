import { describe } from "vite-plus/test";
import { describeHookContract } from "../../test/contracts";
import { createSettingsUploadFixture } from "../../api/team/create-settings-upload.fixture";
import { useCreateSettingsUpload } from "./use-create-settings-upload";
describe("useCreateSettingsUpload", () => {
  describeHookContract({
    kind: "mutation",
    hook: useCreateSettingsUpload,
    operationId: "createQuillsSettingsUpload",
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
    viewer: { kind: "anonymous" },
    takesViewer: false,
    invalidates: [],
  });
});
