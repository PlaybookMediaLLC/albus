import { describe } from "vite-plus/test";
import { describeHookContract } from "../../test/contracts";
import { getEmailChannelStatusFixture } from "../../api/team/get-email-channel-status.fixture";
import { useGetEmailChannelStatus } from "./use-get-email-channel-status";
describe("useGetEmailChannelStatus", () => {
  describeHookContract({
    kind: "query",
    hook: useGetEmailChannelStatus,
    operationId: "getQuillsEmailChannelStatus",
    request: { param: { workspaceId: "workspace_test_1" } },
    emptyRequest: { param: { workspaceId: "" } },
    response: getEmailChannelStatusFixture.ok(),
    viewer: { kind: "anonymous" },
    takesViewer: false,
    invalidates: [],
  });
});
