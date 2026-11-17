import { describe } from "vite-plus/test";
import { describeHookContract } from "../../test/contracts";
import { quillsOperationKey } from "../../api/keys";
import { declinePortalWidgetLinkFixture } from "../../api/portal/decline-portal-widget-link.fixture";
import { useDeclinePortalWidgetLink } from "./use-decline-portal-widget-link";
describe("useDeclinePortalWidgetLink", () => {
  describeHookContract({
    kind: "mutation",
    hook: useDeclinePortalWidgetLink,
    operationId: "declineQuillsPortalWidgetLink",
    request: { param: { workspace: "workspace_test_1" } },
    response: declinePortalWidgetLinkFixture.ok(),
    viewer: { kind: "anonymous" },
    takesViewer: true,
    invalidates: [
      quillsOperationKey(
        "workspace_test_1",
        { kind: "anonymous" },
        "portal",
        "getPortalWidgetLink",
      ),
    ],
  });
});
