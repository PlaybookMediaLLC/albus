import { describe } from "vite-plus/test";
import { describeOperationContract } from "../../test/contracts";
import { listChangelogCategories } from "./list-changelog-categories";
import { listChangelogCategoriesFixture } from "./list-changelog-categories.fixture";
describe("listChangelogCategories", () => {
  describeOperationContract({
    operationId: "listQuillsChangelogCategories",
    operation: listChangelogCategories,
    request: { param: { workspaceId: "workspace_test_1" } },
    response: listChangelogCategoriesFixture.ok(),
    method: "get",
    path: "/api/quills/workspace_test_1/changelog/categories",
    statuses: [401, 403, 429],
  });
});
