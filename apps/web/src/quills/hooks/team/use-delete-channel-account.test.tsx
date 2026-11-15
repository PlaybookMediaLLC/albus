import { describe } from "vite-plus/test";
import { describeHookContract } from "../../test/contracts";
import { quillsOperationKey } from "../../api/keys";
import { deleteChannelAccountFixture } from "../../api/team/delete-channel-account.fixture";
import { useDeleteChannelAccount } from "./use-delete-channel-account";
describe("useDeleteChannelAccount", () => {
  describeHookContract({
    kind: "mutation",
    hook: useDeleteChannelAccount,
    operationId: "deleteQuillsChannelAccount",
    request: {
      param: {
        workspaceId: "workspace_test_1",
        channelAccountId: "channel-account-id_test_1",
      },
    },
    response: deleteChannelAccountFixture.ok(),
    viewer: { kind: "anonymous" },
    takesViewer: true,
    invalidates: [
      quillsOperationKey(
        "workspace_test_1",
        { kind: "anonymous" },
        "team",
        "getEmailChannelConfig",
      ),
    ],
  });
});
