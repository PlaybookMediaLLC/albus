import { describe } from "vite-plus/test";
import { describeOperationContract } from "../../test/contracts";
import { getChangelogEntry } from "./get-changelog-entry";
import { getChangelogEntryFixture } from "./get-changelog-entry.fixture";
describe("getChangelogEntry", () => {
  describeOperationContract({
    operationId: "getQuillsChangelogEntry",
    operation: getChangelogEntry,
    request: {
      param: { workspaceId: "workspace_test_1", entryId: "entry-id_test_1" },
    },
    response: getChangelogEntryFixture.ok(),
    method: "get",
    path: "/api/quills/workspace_test_1/changelog/entry-id_test_1",
    statuses: [401, 403, 404, 429],
  });
});
