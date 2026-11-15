import { describe } from "vite-plus/test";
import { describeHookContract } from "../../test/contracts";
import { getSpamFilterConfigFixture } from "../../api/team/get-spam-filter-config.fixture";
import { useGetSpamFilterConfig } from "./use-get-spam-filter-config";
describe("useGetSpamFilterConfig", () => {
  describeHookContract({
    kind: "query",
    hook: useGetSpamFilterConfig,
    operationId: "getQuillsSpamFilterConfig",
    request: { param: { workspaceId: "workspace_test_1" } },
    emptyRequest: { param: { workspaceId: "" } },
    response: getSpamFilterConfigFixture.ok(),
    viewer: { kind: "anonymous" },
    takesViewer: false,
    invalidates: [],
  });
});
