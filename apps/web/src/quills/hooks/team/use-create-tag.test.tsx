import { describe } from "vite-plus/test";
import { describeHookContract } from "../../test/contracts";
import { quillsOperationKey } from "../../api/keys";
import { createTagFixture } from "../../api/team/create-tag.fixture";
import { useCreateTag } from "./use-create-tag";
describe("useCreateTag", () => {
  describeHookContract({
    kind: "mutation",
    hook: useCreateTag,
    operationId: "createQuillsTag",
    request: {
      param: { workspaceId: "workspace_test_1" },
      json: { name: "value" },
    },
    response: createTagFixture.ok(),
    viewer: { kind: "anonymous" },
    takesViewer: true,
    invalidates: [
      quillsOperationKey(
        "workspace_test_1",
        { kind: "anonymous" },
        "team",
        "listTags",
      ),
    ],
  });
});
