import { describe } from "vite-plus/test";
import { describeOperationContract } from "../../test/contracts";
import { linkPortalWidgetProfile } from "./link-portal-widget-profile";
import { linkPortalWidgetProfileFixture } from "./link-portal-widget-profile.fixture";
describe("linkPortalWidgetProfile", () => {
  describeOperationContract({
    operationId: "linkQuillsPortalWidgetProfile",
    operation: linkPortalWidgetProfile,
    request: { param: { workspace: "workspace_test_1" } },
    response: linkPortalWidgetProfileFixture.ok(),
    method: "post",
    path: "/api/quills-public/workspace_test_1/portal/widget-link",
    statuses: [401, 403, 404, 429],
  });
});
