import { describe } from "vite-plus/test";
import { describeOperationContract } from "../../test/contracts";
import { getEmailAutoAck } from "./get-email-auto-ack";
import { getEmailAutoAckFixture } from "./get-email-auto-ack.fixture";
describe("getEmailAutoAck", () => {
  describeOperationContract({
    operationId: "getQuillsEmailAutoAck",
    operation: getEmailAutoAck,
    request: { param: { workspaceId: "workspace_test_1" } },
    response: getEmailAutoAckFixture.ok(),
    method: "get",
    path: "/api/quills/workspace_test_1/support/email-auto-ack",
    statuses: [401, 403, 429],
  });
});
