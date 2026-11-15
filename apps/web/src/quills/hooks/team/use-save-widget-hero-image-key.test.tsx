import { describe } from "vite-plus/test";
import { describeHookContract } from "../../test/contracts";
import { quillsOperationKey } from "../../api/keys";
import { saveWidgetHeroImageKeyFixture } from "../../api/team/save-widget-hero-image-key.fixture";
import { useSaveWidgetHeroImageKey } from "./use-save-widget-hero-image-key";
describe("useSaveWidgetHeroImageKey", () => {
  describeHookContract({
    kind: "mutation",
    hook: useSaveWidgetHeroImageKey,
    operationId: "saveQuillsWidgetHeroImageKey",
    request: {
      param: { workspaceId: "workspace_test_1" },
      json: { key: "value", contentType: "value", size: 0 },
    },
    response: saveWidgetHeroImageKeyFixture.ok(),
    viewer: { kind: "anonymous" },
    takesViewer: true,
    invalidates: [
      quillsOperationKey(
        "workspace_test_1",
        { kind: "anonymous" },
        "team",
        "getWidgetSettings",
      ),
    ],
  });
});
