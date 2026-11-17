import { describe } from "vite-plus/test";
import { describeHookContract } from "../../test/contracts";
import { getChangelogSettingsFixture } from "../../api/team/get-changelog-settings.fixture";
import { useGetChangelogSettings } from "./use-get-changelog-settings";
describe("useGetChangelogSettings", () => {
  describeHookContract({
    kind: "query",
    hook: useGetChangelogSettings,
    operationId: "getQuillsChangelogSettings",
    request: { param: { workspaceId: "workspace_test_1" } },
    emptyRequest: { param: { workspaceId: "" } },
    response: getChangelogSettingsFixture.ok(),
    viewer: { kind: "anonymous" },
    takesViewer: false,
    invalidates: [],
  });
});
