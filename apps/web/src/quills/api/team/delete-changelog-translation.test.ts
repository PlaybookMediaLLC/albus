import { describe } from "vite-plus/test";
import { describeOperationContract } from "../../test/contracts";
import { deleteChangelogTranslation } from "./delete-changelog-translation";
import { deleteChangelogTranslationFixture } from "./delete-changelog-translation.fixture";
describe("deleteChangelogTranslation", () => {
  describeOperationContract({
    operationId: "deleteQuillsChangelogTranslation",
    operation: deleteChangelogTranslation,
    request: {
      param: {
        workspaceId: "workspace_test_1",
        entryId: "entry-id_test_1",
        locale: "en-US",
      },
    },
    response: deleteChangelogTranslationFixture.ok(),
    method: "delete",
    path: "/api/quills/workspace_test_1/changelog/entry-id_test_1/translations/en-US",
    statuses: [401, 403, 404, 429],
  });
});
