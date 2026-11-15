import { describe } from "vite-plus/test";
import { describeHookContract } from "../../test/contracts";
import { quillsOperationKey } from "../../api/keys";
import { setModerationDefaultFixture } from "../../api/team/set-moderation-default.fixture";
import { useSetModerationDefault } from "./use-set-moderation-default";
describe("useSetModerationDefault", () => {
  describeHookContract({
    kind: "mutation",
    hook: useSetModerationDefault,
    operationId: "setQuillsModerationDefault",
    request: {
      param: { workspaceId: "workspace_test_1" },
      json: { requireApproval: "none" },
    },
    response: setModerationDefaultFixture.ok(),
    viewer: { kind: "anonymous" },
    takesViewer: true,
    invalidates: [
      quillsOperationKey(
        "workspace_test_1",
        { kind: "anonymous" },
        "team",
        "getPortalSettings",
      ),
    ],
  });
});
