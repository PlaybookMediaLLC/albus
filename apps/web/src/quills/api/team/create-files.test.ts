import { describe } from "vite-plus/test";
import { describeOperationContract } from "../../test/contracts";
import { createFiles } from "./create-files";
import { createFilesFixture } from "./create-files.fixture";
describe("createFiles", () => {
  describeOperationContract({
    operationId: "createQuillsFiles",
    operation: createFiles,
    request: {
      param: { workspaceId: "workspace_test_1" },
      json: { key: "value", contentType: "value", size: 0, name: "value" },
    },
    response: createFilesFixture.ok(),
    method: "post",
    path: "/api/quills/workspace_test_1/files",
    statuses: [401, 403, 404, 409, 429],
  });
});
