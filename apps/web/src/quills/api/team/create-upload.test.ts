import { describe } from "vite-plus/test";
import { describeOperationContract } from "../../test/contracts";
import { createUpload } from "./create-upload";
import { createUploadFixture } from "./create-upload.fixture";
describe("createUpload", () => {
  describeOperationContract({
    operationId: "createQuillsUpload",
    operation: createUpload,
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
    method: "post",
    path: "/api/quills/workspace_test_1/files/uploads",
    statuses: [401, 403, 429],
  });
});
