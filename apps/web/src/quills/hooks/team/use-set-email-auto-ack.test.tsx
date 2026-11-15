import { describe } from "vite-plus/test";
import { describeHookContract } from "../../test/contracts";
import { quillsOperationKey } from "../../api/keys";
import { setEmailAutoAckFixture } from "../../api/team/set-email-auto-ack.fixture";
import { useSetEmailAutoAck } from "./use-set-email-auto-ack";
describe("useSetEmailAutoAck", () => {
  describeHookContract({
    kind: "mutation",
    hook: useSetEmailAutoAck,
    operationId: "setQuillsEmailAutoAck",
    request: {
      param: { workspaceId: "workspace_test_1" },
      json: { enabled: false },
    },
    response: setEmailAutoAckFixture.ok(),
    viewer: { kind: "anonymous" },
    takesViewer: true,
    invalidates: [
      quillsOperationKey(
        "workspace_test_1",
        { kind: "anonymous" },
        "team",
        "getEmailAutoAck",
      ),
    ],
  });
});
