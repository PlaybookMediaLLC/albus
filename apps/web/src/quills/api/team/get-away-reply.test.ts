import { describe } from "vite-plus/test";
import { describeOperationContract } from "../../test/contracts";
import { getAwayReply } from "./get-away-reply";
import { getAwayReplyFixture } from "./get-away-reply.fixture";
describe("getAwayReply", () => {
  describeOperationContract({
    operationId: "getQuillsAwayReply",
    operation: getAwayReply,
    request: { param: { workspaceId: "workspace_test_1" } },
    response: getAwayReplyFixture.ok(),
    method: "get",
    path: "/api/quills/workspace_test_1/support/away-reply",
    statuses: [401, 403, 429],
  });
});
