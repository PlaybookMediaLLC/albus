import { describe } from "vite-plus/test";
import { describeOperationContract } from "../../test/contracts";
import { createChangelogCategory } from "./create-changelog-category";
import { createChangelogCategoryFixture } from "./create-changelog-category.fixture";
describe("createChangelogCategory", () => {
  describeOperationContract({
    operationId: "createQuillsChangelogCategory",
    operation: createChangelogCategory,
    request: {
      param: { workspaceId: "workspace_test_1" },
      json: { name: "value" },
    },
    response: createChangelogCategoryFixture.ok(),
    method: "post",
    path: "/api/quills/workspace_test_1/changelog/categories",
    statuses: [401, 403, 404, 409, 429],
  });
});
