import { describe } from "vite-plus/test";
import { describeOperationContract } from "../../test/contracts";
import { setAwayReply } from "./set-away-reply";
import { setAwayReplyFixture } from "./set-away-reply.fixture";
describe("setAwayReply", () => {
  describeOperationContract({
    operationId: "setQuillsAwayReply",
    operation: setAwayReply,
    request: {
      param: { workspaceId: "workspace_test_1" },
      json: { enabled: false, message: "value" },
    },
    response: setAwayReplyFixture.ok(),
    method: "put",
    path: "/api/quills/workspace_test_1/support/away-reply",
    statuses: [401, 403, 429],
  });
});
