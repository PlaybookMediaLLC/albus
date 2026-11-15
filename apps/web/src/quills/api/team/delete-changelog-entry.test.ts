import { describe } from "vite-plus/test";
import { describeOperationContract } from "../../test/contracts";
import { deleteChangelogEntry } from "./delete-changelog-entry";
import { deleteChangelogEntryFixture } from "./delete-changelog-entry.fixture";
describe("deleteChangelogEntry", () => {
  describeOperationContract({
    operationId: "deleteQuillsChangelogEntry",
    operation: deleteChangelogEntry,
    request: {
      param: { workspaceId: "workspace_test_1", entryId: "entry-id_test_1" },
    },
    response: deleteChangelogEntryFixture.ok(),
    method: "delete",
    path: "/api/quills/workspace_test_1/changelog/entry-id_test_1",
    statuses: [401, 403, 404, 429],
  });
});
