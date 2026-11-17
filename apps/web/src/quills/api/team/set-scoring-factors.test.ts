import { describe } from "vite-plus/test";
import { describeOperationContract } from "../../test/contracts";
import { setScoringFactors } from "./set-scoring-factors";
import { setScoringFactorsFixture } from "./set-scoring-factors.fixture";
describe("setScoringFactors", () => {
  describeOperationContract({
    operationId: "setQuillsScoringFactors",
    operation: setScoringFactors,
    request: {
      param: { workspaceId: "workspace_test_1" },
      json: { factors: [] },
    },
    response: setScoringFactorsFixture.ok(),
    method: "put",
    path: "/api/quills/workspace_test_1/feedback/scoring-factors",
    statuses: [400, 401, 403, 429],
  });
});
