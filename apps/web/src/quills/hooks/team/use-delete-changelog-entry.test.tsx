import { describe } from "vite-plus/test";
import { describeHookContract } from "../../test/contracts";
import { quillsOperationKey } from "../../api/keys";
import { deleteChangelogEntryFixture } from "../../api/team/delete-changelog-entry.fixture";
import { useDeleteChangelogEntry } from "./use-delete-changelog-entry";
describe("useDeleteChangelogEntry", () => {
  describeHookContract({
    kind: "mutation",
    hook: useDeleteChangelogEntry,
    operationId: "deleteQuillsChangelogEntry",
    request: {
      param: { workspaceId: "workspace_test_1", entryId: "entry-id_test_1" },
    },
    response: deleteChangelogEntryFixture.ok(),
    viewer: { kind: "anonymous" },
    takesViewer: true,
    invalidates: [
      quillsOperationKey(
        "workspace_test_1",
        { kind: "anonymous" },
        "team",
        "listChangelog",
      ),
    ],
  });
});
