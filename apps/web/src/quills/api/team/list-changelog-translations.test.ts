import { describe } from "vite-plus/test";
import { describeOperationContract } from "../../test/contracts";
import { listChangelogTranslations } from "./list-changelog-translations";
import { listChangelogTranslationsFixture } from "./list-changelog-translations.fixture";
describe("listChangelogTranslations", () => {
  describeOperationContract({
    operationId: "listQuillsChangelogTranslations",
    operation: listChangelogTranslations,
    request: {
      param: { workspaceId: "workspace_test_1", entryId: "entry-id_test_1" },
    },
    response: listChangelogTranslationsFixture.ok(),
    method: "get",
    path: "/api/quills/workspace_test_1/changelog/entry-id_test_1/translations",
    statuses: [401, 403, 404, 429],
  });
});
