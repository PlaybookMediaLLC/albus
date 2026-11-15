import { describe } from "vite-plus/test";
import { describeOperationContract } from "../../test/contracts";
import { listChangelog } from "./list-changelog";
import { listChangelogFixture } from "./list-changelog.fixture";
describe("listChangelog", () => {
  describeOperationContract({
    operationId: "listQuillsChangelog",
    operation: listChangelog,
    request: { param: { workspaceId: "workspace_test_1" } },
    response: listChangelogFixture.ok(),
    method: "get",
    path: "/api/quills/workspace_test_1/changelog",
    statuses: [401, 403, 429],
  });
});
