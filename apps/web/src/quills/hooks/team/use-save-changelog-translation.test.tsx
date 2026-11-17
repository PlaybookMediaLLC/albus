import { describe } from "vite-plus/test";
import { describeHookContract } from "../../test/contracts";
import { quillsOperationKey } from "../../api/keys";
import { saveChangelogTranslationFixture } from "../../api/team/save-changelog-translation.fixture";
import { useSaveChangelogTranslation } from "./use-save-changelog-translation";
describe("useSaveChangelogTranslation", () => {
  describeHookContract({
    kind: "mutation",
    hook: useSaveChangelogTranslation,
    operationId: "saveQuillsChangelogTranslation",
    request: {
      param: {
        workspaceId: "workspace_test_1",
        entryId: "entry-id_test_1",
      },
      json: { locale: "en-US", title: "value", content: "value" },
    },
    response: saveChangelogTranslationFixture.ok(),
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
