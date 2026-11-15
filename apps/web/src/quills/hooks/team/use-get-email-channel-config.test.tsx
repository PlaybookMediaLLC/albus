import { describe } from "vite-plus/test";
import { describeHookContract } from "../../test/contracts";
import { getEmailChannelConfigFixture } from "../../api/team/get-email-channel-config.fixture";
import { useGetEmailChannelConfig } from "./use-get-email-channel-config";
describe("useGetEmailChannelConfig", () => {
  describeHookContract({
    kind: "query",
    hook: useGetEmailChannelConfig,
    operationId: "getQuillsEmailChannelConfig",
    request: { param: { workspaceId: "workspace_test_1" } },
    emptyRequest: { param: { workspaceId: "" } },
    response: getEmailChannelConfigFixture.ok(),
    viewer: { kind: "anonymous" },
    takesViewer: false,
    invalidates: [],
  });
});
