import { describe } from "vite-plus/test";
import { describeOperationContract } from "../../test/contracts";
import { setEmailAutoAck } from "./set-email-auto-ack";
import { setEmailAutoAckFixture } from "./set-email-auto-ack.fixture";
describe("setEmailAutoAck", () => {
  describeOperationContract({
    operationId: "setQuillsEmailAutoAck",
    operation: setEmailAutoAck,
    request: {
      param: { workspaceId: "workspace_test_1" },
      json: { enabled: false },
    },
    response: setEmailAutoAckFixture.ok(),
    method: "put",
    path: "/api/quills/workspace_test_1/support/email-auto-ack",
    statuses: [401, 403, 429],
  });
});
