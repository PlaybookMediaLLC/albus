import { describe } from "vite-plus/test";
import { describeHookContract } from "../../test/contracts";
import { quillsOperationKey } from "../../api/keys";
import { updateChangelogEntryFixture } from "../../api/team/update-changelog-entry.fixture";
import { useUpdateChangelogEntry } from "./use-update-changelog-entry";
describe("useUpdateChangelogEntry", () => {
  describeHookContract({
    kind: "mutation",
    hook: useUpdateChangelogEntry,
    operationId: "updateQuillsChangelogEntry",
    request: {
      param: { workspaceId: "workspace_test_1", entryId: "entry-id_test_1" },
      json: {},
    },
    response: updateChangelogEntryFixture.ok(),
    viewer: { kind: "anonymous" },
    takesViewer: true,
    invalidates: [
      quillsOperationKey(
        "workspace_test_1",
        { kind: "anonymous" },
        "team",
        "listChangelog",
      ),
      quillsOperationKey(
        "workspace_test_1",
        { kind: "anonymous" },
        "team",
        "getChangelogEntry",
      ),
    ],
  });
});
