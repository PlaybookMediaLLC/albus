import { describe } from "vite-plus/test";
import { describeHookContract } from "../../test/contracts";
import { quillsOperationKey } from "../../api/keys";
import { createChangelogEntryFixture } from "../../api/team/create-changelog-entry.fixture";
import { useCreateChangelogEntry } from "./use-create-changelog-entry";
describe("useCreateChangelogEntry", () => {
  describeHookContract({
    kind: "mutation",
    hook: useCreateChangelogEntry,
    operationId: "createQuillsChangelogEntry",
    request: {
      param: { workspaceId: "workspace_test_1" },
      json: {
        title: "value",
        content: "value",
        publishState: { type: "draft" },
      },
    },
    response: createChangelogEntryFixture.ok(),
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
