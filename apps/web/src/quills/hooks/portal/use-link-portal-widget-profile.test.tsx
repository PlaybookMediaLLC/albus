import { describe } from "vite-plus/test";
import { describeHookContract } from "../../test/contracts";
import { quillsOperationKey } from "../../api/keys";
import { linkPortalWidgetProfileFixture } from "../../api/portal/link-portal-widget-profile.fixture";
import { useLinkPortalWidgetProfile } from "./use-link-portal-widget-profile";
describe("useLinkPortalWidgetProfile", () => {
  describeHookContract({
    kind: "mutation",
    hook: useLinkPortalWidgetProfile,
    operationId: "linkQuillsPortalWidgetProfile",
    request: { param: { workspace: "workspace_test_1" } },
    response: linkPortalWidgetProfileFixture.ok(),
    viewer: { kind: "anonymous" },
    takesViewer: true,
    invalidates: [
      quillsOperationKey(
        "workspace_test_1",
        { kind: "anonymous" },
        "portal",
        "getPortalWidgetLink",
      ),
      quillsOperationKey(
        "workspace_test_1",
        { kind: "anonymous" },
        "feedback",
        "listPortalMyFeedback",
      ),
      quillsOperationKey(
        "workspace_test_1",
        { kind: "anonymous" },
        "support",
        "listMyConversations",
      ),
      quillsOperationKey(
        "workspace_test_1",
        { kind: "anonymous" },
        "support",
        "getMyTickets",
      ),
      quillsOperationKey(
        "workspace_test_1",
        { kind: "anonymous" },
        "portal",
        "getCustomerProfile",
      ),
      quillsOperationKey(
        "workspace_test_1",
        { kind: "anonymous" },
        "portal",
        "evaluateMyPortalAccess",
      ),
    ],
  });
});
