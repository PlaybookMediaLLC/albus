import { describe } from "vite-plus/test";
import { describeOperationContract } from "../../test/contracts";
import { updateChangelogEntry } from "./update-changelog-entry";
import { updateChangelogEntryFixture } from "./update-changelog-entry.fixture";
describe("updateChangelogEntry", () => {
  describeOperationContract({
    operationId: "updateQuillsChangelogEntry",
    operation: updateChangelogEntry,
    request: {
      param: { workspaceId: "workspace_test_1", entryId: "entry-id_test_1" },
      json: {},
    },
    response: updateChangelogEntryFixture.ok(),
    method: "patch",
    path: "/api/quills/workspace_test_1/changelog/entry-id_test_1",
    statuses: [401, 403, 404, 429],
  });
});
