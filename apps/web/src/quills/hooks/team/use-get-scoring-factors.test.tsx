import { describe } from "vite-plus/test";
import { describeHookContract } from "../../test/contracts";
import { getScoringFactorsFixture } from "../../api/team/get-scoring-factors.fixture";
import { useGetScoringFactors } from "./use-get-scoring-factors";
describe("useGetScoringFactors", () => {
  describeHookContract({
    kind: "query",
    hook: useGetScoringFactors,
    operationId: "getQuillsScoringFactors",
    request: { param: { workspaceId: "workspace_test_1" } },
    emptyRequest: { param: { workspaceId: "" } },
    response: getScoringFactorsFixture.ok(),
    viewer: { kind: "anonymous" },
    takesViewer: false,
    invalidates: [],
  });
});
