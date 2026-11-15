import { describe } from "vite-plus/test";
import { describeOperationContract } from "../../test/contracts";
import { setModerationDefault } from "./set-moderation-default";
import { setModerationDefaultFixture } from "./set-moderation-default.fixture";
describe("setModerationDefault", () => {
  describeOperationContract({
    operationId: "setQuillsModerationDefault",
    operation: setModerationDefault,
    request: {
      param: { workspaceId: "workspace_test_1" },
      json: { requireApproval: "none" },
    },
    response: setModerationDefaultFixture.ok(),
    method: "put",
    path: "/api/quills/workspace_test_1/moderation/default",
    statuses: [401, 403, 409, 429],
  });
});
