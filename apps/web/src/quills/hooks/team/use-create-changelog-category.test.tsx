import { describe } from "vite-plus/test";
import { describeHookContract } from "../../test/contracts";
import { quillsOperationKey } from "../../api/keys";
import { createChangelogCategoryFixture } from "../../api/team/create-changelog-category.fixture";
import { useCreateChangelogCategory } from "./use-create-changelog-category";
describe("useCreateChangelogCategory", () => {
  describeHookContract({
    kind: "mutation",
    hook: useCreateChangelogCategory,
    operationId: "createQuillsChangelogCategory",
    request: {
      param: { workspaceId: "workspace_test_1" },
      json: { name: "value" },
    },
    response: createChangelogCategoryFixture.ok(),
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
