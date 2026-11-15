import { describe } from "vite-plus/test";
import { describeHookContract } from "../../test/contracts";
import { quillsOperationKey } from "../../api/keys";
import { rotateWidgetSecretFixture } from "../../api/team/rotate-widget-secret.fixture";
import { useRotateWidgetSecret } from "./use-rotate-widget-secret";
describe("useRotateWidgetSecret", () => {
  describeHookContract({
    kind: "mutation",
    hook: useRotateWidgetSecret,
    operationId: "rotateQuillsWidgetSecret",
    request: { param: { workspaceId: "workspace_test_1" } },
    response: rotateWidgetSecretFixture.ok(),
    viewer: { kind: "anonymous" },
    takesViewer: true,
    invalidates: [
      quillsOperationKey(
        "workspace_test_1",
        { kind: "anonymous" },
        "team",
        "getWidgetSecret",
      ),
    ],
  });
});
