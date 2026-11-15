import { describe } from "vite-plus/test";
import { describeHookContract } from "../../test/contracts";
import { quillsOperationKey } from "../../api/keys";
import { deleteTagFixture } from "../../api/team/delete-tag.fixture";
import { useDeleteTag } from "./use-delete-tag";
describe("useDeleteTag", () => {
  describeHookContract({
    kind: "mutation",
    hook: useDeleteTag,
    operationId: "deleteQuillsTag",
    request: {
      param: { workspaceId: "workspace_test_1", tagId: "tag-id_test_1" },
    },
    response: deleteTagFixture.ok(),
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
