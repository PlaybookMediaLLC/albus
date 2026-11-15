import { describe } from "vite-plus/test";
import { describeHookContract } from "../../test/contracts";
import { createUploadFixture } from "../../api/team/create-upload.fixture";
import { useCreateUpload } from "./use-create-upload";
describe("useCreateUpload", () => {
  describeHookContract({
    kind: "mutation",
    hook: useCreateUpload,
    operationId: "createQuillsUpload",
    request: {
      param: { workspaceId: "workspace_test_1" },
      json: {
        purpose: "file",
        filename: "value",
        contentType: "value",
        size: 0,
      },
    },
    response: createUploadFixture.ok(),
    viewer: { kind: "anonymous" },
    takesViewer: false,
    invalidates: [],
  });
});
