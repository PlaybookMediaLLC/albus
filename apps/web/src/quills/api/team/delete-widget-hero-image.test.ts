import { describe } from "vite-plus/test";
import { describeOperationContract } from "../../test/contracts";
import { deleteWidgetHeroImage } from "./delete-widget-hero-image";
import { deleteWidgetHeroImageFixture } from "./delete-widget-hero-image.fixture";
describe("deleteWidgetHeroImage", () => {
  describeOperationContract({
    operationId: "deleteQuillsWidgetHeroImage",
    operation: deleteWidgetHeroImage,
    request: { param: { workspaceId: "workspace_test_1" } },
    response: deleteWidgetHeroImageFixture.ok(),
    method: "delete",
    path: "/api/quills/workspace_test_1/settings/widget/hero-image",
    statuses: [401, 403, 429],
  });
});
