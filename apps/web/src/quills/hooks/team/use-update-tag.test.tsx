import { describe } from "vite-plus/test";
import { describeHookContract } from "../../test/contracts";
import { quillsOperationKey } from "../../api/keys";
import { updateTagFixture } from "../../api/team/update-tag.fixture";
import { useUpdateTag } from "./use-update-tag";
describe("useUpdateTag", () => {
  describeHookContract({
    kind: "mutation",
    hook: useUpdateTag,
    operationId: "updateQuillsTag",
    request: {
      param: { workspaceId: "workspace_test_1", tagId: "tag-id_test_1" },
      json: {},
    },
    response: updateTagFixture.ok(),
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
