import { describe } from "vite-plus/test";
import { describeHookContract } from "../../test/contracts";
import { getEmailAutoAckFixture } from "../../api/team/get-email-auto-ack.fixture";
import { useGetEmailAutoAck } from "./use-get-email-auto-ack";
describe("useGetEmailAutoAck", () => {
  describeHookContract({
    kind: "query",
    hook: useGetEmailAutoAck,
    operationId: "getQuillsEmailAutoAck",
    request: { param: { workspaceId: "workspace_test_1" } },
    emptyRequest: { param: { workspaceId: "" } },
    response: getEmailAutoAckFixture.ok(),
    viewer: { kind: "anonymous" },
    takesViewer: false,
    invalidates: [],
  });
});
