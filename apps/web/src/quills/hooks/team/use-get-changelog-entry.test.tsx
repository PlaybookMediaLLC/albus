import { describe } from "vite-plus/test";
import { describeHookContract } from "../../test/contracts";
import { getChangelogEntryFixture } from "../../api/team/get-changelog-entry.fixture";
import { useGetChangelogEntry } from "./use-get-changelog-entry";
describe("useGetChangelogEntry", () => {
  describeHookContract({
    kind: "query",
    hook: useGetChangelogEntry,
    operationId: "getQuillsChangelogEntry",
    request: {
      param: { workspaceId: "workspace_test_1", entryId: "entry-id_test_1" },
    },
    emptyRequest: { param: { workspaceId: "", entryId: "entry-id_test_1" } },
    response: getChangelogEntryFixture.ok(),
    viewer: { kind: "anonymous" },
    takesViewer: false,
    invalidates: [],
  });
});
