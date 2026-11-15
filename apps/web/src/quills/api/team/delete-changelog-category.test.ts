import { describe } from "vite-plus/test";
import { describeOperationContract } from "../../test/contracts";
import { deleteChangelogCategory } from "./delete-changelog-category";
import { deleteChangelogCategoryFixture } from "./delete-changelog-category.fixture";
describe("deleteChangelogCategory", () => {
  describeOperationContract({
    operationId: "deleteQuillsChangelogCategory",
    operation: deleteChangelogCategory,
    request: {
      param: {
        workspaceId: "workspace_test_1",
        categoryId: "category-id_test_1",
      },
    },
    response: deleteChangelogCategoryFixture.ok(),
    method: "delete",
    path: "/api/quills/workspace_test_1/changelog/categories/category-id_test_1",
    statuses: [401, 403, 404, 429],
  });
});
