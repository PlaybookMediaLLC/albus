import { describe } from "vite-plus/test";
import { describeHookContract } from "../../test/contracts";
import { listChangelogTranslationsFixture } from "../../api/team/list-changelog-translations.fixture";
import { useListChangelogTranslations } from "./use-list-changelog-translations";
describe("useListChangelogTranslations", () => {
  describeHookContract({
    kind: "query",
    hook: useListChangelogTranslations,
    operationId: "listQuillsChangelogTranslations",
    request: {
      param: { workspaceId: "workspace_test_1", entryId: "entry-id_test_1" },
    },
    emptyRequest: { param: { workspaceId: "", entryId: "entry-id_test_1" } },
    response: listChangelogTranslationsFixture.ok(),
    viewer: { kind: "anonymous" },
    takesViewer: false,
    invalidates: [],
  });
});
