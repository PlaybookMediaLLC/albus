import { describe } from "vite-plus/test";
import { describeOperationContract } from "../../test/contracts";
import { saveWidgetHeroImageKey } from "./save-widget-hero-image-key";
import { saveWidgetHeroImageKeyFixture } from "./save-widget-hero-image-key.fixture";
describe("saveWidgetHeroImageKey", () => {
  describeOperationContract({
    operationId: "saveQuillsWidgetHeroImageKey",
    operation: saveWidgetHeroImageKey,
    request: {
      param: { workspaceId: "workspace_test_1" },
      json: { key: "value", contentType: "value", size: 0 },
    },
    response: saveWidgetHeroImageKeyFixture.ok(),
    method: "put",
    path: "/api/quills/workspace_test_1/settings/widget/hero-image",
    statuses: [401, 403, 404, 429],
  });
});
