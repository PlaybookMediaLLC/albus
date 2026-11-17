import { describe } from "vite-plus/test";
import { describeOperationContract } from "../../test/contracts";
import { getScoringFactors } from "./get-scoring-factors";
import { getScoringFactorsFixture } from "./get-scoring-factors.fixture";
describe("getScoringFactors", () => {
  describeOperationContract({
    operationId: "getQuillsScoringFactors",
    operation: getScoringFactors,
    request: { param: { workspaceId: "workspace_test_1" } },
    response: getScoringFactorsFixture.ok(),
    method: "get",
    path: "/api/quills/workspace_test_1/feedback/scoring-factors",
    statuses: [401, 403, 429],
  });
});
