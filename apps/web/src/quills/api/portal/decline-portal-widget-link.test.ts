import { describe } from "vite-plus/test";
import { describeOperationContract } from "../../test/contracts";
import { declinePortalWidgetLink } from "./decline-portal-widget-link";
import { declinePortalWidgetLinkFixture } from "./decline-portal-widget-link.fixture";
describe("declinePortalWidgetLink", () => {
  describeOperationContract({
    operationId: "declineQuillsPortalWidgetLink",
    operation: declinePortalWidgetLink,
    request: { param: { workspace: "workspace_test_1" } },
    response: declinePortalWidgetLinkFixture.ok(),
    method: "delete",
    path: "/api/quills-public/workspace_test_1/portal/widget-link",
    statuses: [401, 403, 404, 429],
  });
});
