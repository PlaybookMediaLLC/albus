import { describe } from "vite-plus/test";
import { describeHookContract } from "../../test/contracts";
import { quillsOperationKey } from "../../api/keys";
import { deleteWidgetHeroImageFixture } from "../../api/team/delete-widget-hero-image.fixture";
import { useDeleteWidgetHeroImage } from "./use-delete-widget-hero-image";
describe("useDeleteWidgetHeroImage", () => {
  describeHookContract({
    kind: "mutation",
    hook: useDeleteWidgetHeroImage,
    operationId: "deleteQuillsWidgetHeroImage",
    request: { param: { workspaceId: "workspace_test_1" } },
    response: deleteWidgetHeroImageFixture.ok(),
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
