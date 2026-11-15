import { describe } from "vite-plus/test";
import { describeOperationContract } from "../../test/contracts";
import { rotateWidgetSecret } from "./rotate-widget-secret";
import { rotateWidgetSecretFixture } from "./rotate-widget-secret.fixture";
describe("rotateWidgetSecret", () => {
  describeOperationContract({
    operationId: "rotateQuillsWidgetSecret",
    operation: rotateWidgetSecret,
    request: { param: { workspaceId: "workspace_test_1" } },
    response: rotateWidgetSecretFixture.ok(),
    method: "post",
    path: "/api/quills/workspace_test_1/settings/widget/secret",
    statuses: [401, 403, 429],
  });
});
