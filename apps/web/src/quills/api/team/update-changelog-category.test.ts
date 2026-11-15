import { describe } from "vite-plus/test";
import { describeOperationContract } from "../../test/contracts";
import { updateChangelogCategory } from "./update-changelog-category";
import { updateChangelogCategoryFixture } from "./update-changelog-category.fixture";
describe("updateChangelogCategory", () => {
  describeOperationContract({
    operationId: "updateQuillsChangelogCategory",
    operation: updateChangelogCategory,
    request: {
      param: {
        workspaceId: "workspace_test_1",
        categoryId: "category-id_test_1",
      },
      json: {},
    },
    response: updateChangelogCategoryFixture.ok(),
    method: "patch",
    path: "/api/quills/workspace_test_1/changelog/categories/category-id_test_1",
    statuses: [401, 403, 404, 409, 429],
  });
});
