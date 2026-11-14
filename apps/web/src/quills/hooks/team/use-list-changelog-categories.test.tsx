import { describe } from "vite-plus/test";
import { describeHookContract } from "../../test/contracts";
import { listChangelogCategoriesFixture } from "../../api/team/list-changelog-categories.fixture";
import { useListChangelogCategories } from "./use-list-changelog-categories";
describe("useListChangelogCategories", () => {
  describeHookContract({
    kind: "query",
    hook: useListChangelogCategories,
    operationId: "listQuillsChangelogCategories",
    request: { param: { workspaceId: "workspace_test_1" } },
    emptyRequest: { param: { workspaceId: "" } },
    response: listChangelogCategoriesFixture.ok(),
    viewer: { kind: "anonymous" },
    takesViewer: false,
    invalidates: [],
  });
});
