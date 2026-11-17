import { describe } from "vite-plus/test";
import { describeHookContract } from "../../test/contracts";
import { quillsOperationKey } from "../../api/keys";
import { deleteChangelogTranslationFixture } from "../../api/team/delete-changelog-translation.fixture";
import { useDeleteChangelogTranslation } from "./use-delete-changelog-translation";
describe("useDeleteChangelogTranslation", () => {
  describeHookContract({
    kind: "mutation",
    hook: useDeleteChangelogTranslation,
    operationId: "deleteQuillsChangelogTranslation",
    request: {
      param: {
        workspaceId: "workspace_test_1",
        entryId: "entry-id_test_1",
        locale: "en-US",
      },
    },
    response: deleteChangelogTranslationFixture.ok(),
    viewer: { kind: "anonymous" },
    takesViewer: true,
    invalidates: [
      quillsOperationKey(
        "workspace_test_1",
        { kind: "anonymous" },
        "team",
        "listChangelogTranslations",
      ),
    ],
  });
});
