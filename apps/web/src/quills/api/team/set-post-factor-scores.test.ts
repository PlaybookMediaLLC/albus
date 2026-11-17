import { describe } from "vite-plus/test";
import { describeOperationContract } from "../../test/contracts";
import { setPostFactorScores } from "./set-post-factor-scores";
import { setPostFactorScoresFixture } from "./set-post-factor-scores.fixture";
describe("setPostFactorScores", () => {
  describeOperationContract({
    operationId: "setQuillsPostFactorScores",
    operation: setPostFactorScores,
    request: {
      param: { workspaceId: "workspace_test_1", postId: "post-id_test_1" },
      json: { values: [] },
    },
    response: setPostFactorScoresFixture.ok(),
    method: "put",
    path: "/api/quills/workspace_test_1/posts/post-id_test_1/factor-scores",
    statuses: [400, 401, 403, 404, 429],
  });
});
