import { describe } from "vite-plus/test";
import { describeHookContract } from "../../test/contracts";
import { quillsOperationKey } from "../../api/keys";
import { deleteChangelogCategoryFixture } from "../../api/team/delete-changelog-category.fixture";
import { useDeleteChangelogCategory } from "./use-delete-changelog-category";
describe("useDeleteChangelogCategory", () => {
  describeHookContract({
    kind: "mutation",
    hook: useDeleteChangelogCategory,
    operationId: "deleteQuillsChangelogCategory",
    request: {
      param: {
        workspaceId: "workspace_test_1",
        categoryId: "category-id_test_1",
      },
    },
    response: deleteChangelogCategoryFixture.ok(),
    viewer: { kind: "anonymous" },
    takesViewer: true,
    invalidates: [
      quillsOperationKey(
        "workspace_test_1",
        { kind: "anonymous" },
        "team",
        "listChangelogCategories",
      ),
    ],
  });
});
