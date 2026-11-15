import { describe } from "vite-plus/test";
import { describeHookContract } from "../../test/contracts";
import { getWidgetSecretFixture } from "../../api/team/get-widget-secret.fixture";
import { useGetWidgetSecret } from "./use-get-widget-secret";
describe("useGetWidgetSecret", () => {
  describeHookContract({
    kind: "query",
    hook: useGetWidgetSecret,
    operationId: "getQuillsWidgetSecret",
    request: { param: { workspaceId: "workspace_test_1" } },
    emptyRequest: { param: { workspaceId: "" } },
    response: getWidgetSecretFixture.ok(),
    viewer: { kind: "anonymous" },
    takesViewer: false,
    invalidates: [],
  });
});
