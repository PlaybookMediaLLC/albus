import { describe } from "vite-plus/test";
import { describeOperationContract } from "../../test/contracts";
import { getPortalWidgetLink } from "./get-portal-widget-link";
import { getPortalWidgetLinkFixture } from "./get-portal-widget-link.fixture";
describe("getPortalWidgetLink", () => {
  describeOperationContract({
    operationId: "getQuillsPortalWidgetLink",
    operation: getPortalWidgetLink,
    request: { param: { workspace: "workspace_test_1" } },
    response: getPortalWidgetLinkFixture.ok(),
    method: "get",
    path: "/api/quills-public/workspace_test_1/portal/widget-link",
    statuses: [401, 403, 404],
  });
});
