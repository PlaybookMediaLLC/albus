import { describe } from "vite-plus/test";
import { describeHookContract } from "../../test/contracts";
import { quillsOperationKey } from "../../api/keys";
import { updateSpamFilterConfigFixture } from "../../api/team/update-spam-filter-config.fixture";
import { useUpdateSpamFilterConfig } from "./use-update-spam-filter-config";
describe("useUpdateSpamFilterConfig", () => {
  describeHookContract({
    kind: "mutation",
    hook: useUpdateSpamFilterConfig,
    operationId: "updateQuillsSpamFilterConfig",
    request: { param: { workspaceId: "workspace_test_1" }, json: {} },
    response: updateSpamFilterConfigFixture.ok(),
    viewer: { kind: "anonymous" },
    takesViewer: true,
    invalidates: [
      quillsOperationKey(
        "workspace_test_1",
        { kind: "anonymous" },
        "team",
        "getSpamFilterConfig",
      ),
    ],
  });
});
