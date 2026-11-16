import { describe } from "vite-plus/test";
import { describeHookContract } from "../../test/contracts";
import { createFilesFixture } from "../../api/team/create-files.fixture";
import { useCreateFiles } from "./use-create-files";
describe("useCreateFiles", () => {
  describeHookContract({
    kind: "mutation",
    hook: useCreateFiles,
    operationId: "createQuillsFiles",
    request: {
      param: { workspaceId: "workspace_test_1" },
      json: { key: "value", contentType: "value", size: 0, name: "value" },
    },
    response: createFilesFixture.ok(),
    viewer: { kind: "anonymous" },
    takesViewer: false,
    invalidates: [],
  });
});
