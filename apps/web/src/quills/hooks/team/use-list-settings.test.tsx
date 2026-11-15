import { describe } from "vite-plus/test";
import { describeHookContract } from "../../test/contracts";
import { listSettingsFixture } from "../../api/team/list-settings.fixture";
import { useListSettings } from "./use-list-settings";
describe("useListSettings", () => {
  describeHookContract({
    kind: "query",
    hook: useListSettings,
    operationId: "listQuillsSettings",
    request: { param: { workspaceId: "workspace_test_1" } },
    emptyRequest: { param: { workspaceId: "" } },
    response: listSettingsFixture.ok(),
    viewer: { kind: "anonymous" },
    takesViewer: false,
    invalidates: [],
  });
});
