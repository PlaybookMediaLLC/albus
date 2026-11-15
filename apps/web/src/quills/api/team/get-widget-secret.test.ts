import { describe } from "vite-plus/test";
import { describeOperationContract } from "../../test/contracts";
import { getWidgetSecret } from "./get-widget-secret";
import { getWidgetSecretFixture } from "./get-widget-secret.fixture";
describe("getWidgetSecret", () => {
  describeOperationContract({
    operationId: "getQuillsWidgetSecret",
    operation: getWidgetSecret,
    request: { param: { workspaceId: "workspace_test_1" } },
    response: getWidgetSecretFixture.ok(),
    method: "get",
    path: "/api/quills/workspace_test_1/settings/widget/secret",
    statuses: [401, 403, 429],
  });
});
