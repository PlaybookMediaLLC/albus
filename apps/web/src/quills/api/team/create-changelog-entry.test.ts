import { describe } from "vite-plus/test";
import { describeOperationContract } from "../../test/contracts";
import { createChangelogEntry } from "./create-changelog-entry";
import { createChangelogEntryFixture } from "./create-changelog-entry.fixture";
describe("createChangelogEntry", () => {
  describeOperationContract({
    operationId: "createQuillsChangelogEntry",
    operation: createChangelogEntry,
    request: {
      param: { workspaceId: "workspace_test_1" },
      json: {
        title: "value",
        content: "value",
        publishState: { type: "draft" },
      },
    },
    response: createChangelogEntryFixture.ok(),
    method: "post",
    path: "/api/quills/workspace_test_1/changelog",
    statuses: [401, 403, 404, 429],
  });
});
