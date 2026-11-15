import { describe } from "vite-plus/test";
import { describeHookContract } from "../../test/contracts";
import { quillsOperationKey } from "../../api/keys";
import { updateChangelogCategoryFixture } from "../../api/team/update-changelog-category.fixture";
import { useUpdateChangelogCategory } from "./use-update-changelog-category";
describe("useUpdateChangelogCategory", () => {
  describeHookContract({
    kind: "mutation",
    hook: useUpdateChangelogCategory,
    operationId: "updateQuillsChangelogCategory",
    request: {
      param: {
        workspaceId: "workspace_test_1",
        categoryId: "category-id_test_1",
      },
      json: {},
    },
    response: updateChangelogCategoryFixture.ok(),
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
