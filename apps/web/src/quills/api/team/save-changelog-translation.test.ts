import { describe } from "vite-plus/test";
import { describeOperationContract } from "../../test/contracts";
import { saveChangelogTranslation } from "./save-changelog-translation";
import { saveChangelogTranslationFixture } from "./save-changelog-translation.fixture";
describe("saveChangelogTranslation", () => {
  describeOperationContract({
    operationId: "saveQuillsChangelogTranslation",
    operation: saveChangelogTranslation,
    request: {
      param: {
        workspaceId: "workspace_test_1",
        entryId: "entry-id_test_1",
      },
      json: { locale: "en-US", title: "value", content: "value" },
    },
    response: saveChangelogTranslationFixture.ok(),
    method: "put",
    path: "/api/quills/workspace_test_1/changelog/entry-id_test_1/translations",
    statuses: [401, 403, 404, 429],
  });
});
