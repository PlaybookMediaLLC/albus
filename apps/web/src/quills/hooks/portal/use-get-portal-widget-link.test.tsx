import { describe } from "vite-plus/test";
import { describeHookContract } from "../../test/contracts";
import { getPortalWidgetLinkFixture } from "../../api/portal/get-portal-widget-link.fixture";
import { useGetPortalWidgetLink } from "./use-get-portal-widget-link";
describe("useGetPortalWidgetLink", () => {
  describeHookContract({
    kind: "query",
    hook: useGetPortalWidgetLink,
    operationId: "getQuillsPortalWidgetLink",
    request: { param: { workspace: "workspace_test_1" } },
    emptyRequest: { param: { workspace: "" } },
    response: getPortalWidgetLinkFixture.ok(),
    viewer: { kind: "anonymous" },
    takesViewer: false,
    invalidates: [],
  });
});
