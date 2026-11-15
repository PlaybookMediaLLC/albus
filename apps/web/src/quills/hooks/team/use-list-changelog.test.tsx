import { describe } from "vite-plus/test";
import { describeHookContract } from "../../test/contracts";
import { listChangelogFixture } from "../../api/team/list-changelog.fixture";
import { useListChangelog } from "./use-list-changelog";
describe("useListChangelog", () => {
  describeHookContract({
    kind: "query",
    hook: useListChangelog,
    operationId: "listQuillsChangelog",
    request: { param: { workspaceId: "workspace_test_1" } },
    emptyRequest: { param: { workspaceId: "" } },
    response: listChangelogFixture.ok(),
    viewer: { kind: "anonymous" },
    takesViewer: false,
    invalidates: [],
    paged: { cursor: "cursor_test_2" },
  });
});
