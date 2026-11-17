import { describe } from "vite-plus/test";
import { describeHookContract } from "../../test/contracts";
import { quillsOperationKey } from "../../api/keys";
import { setScoringFactorsFixture } from "../../api/team/set-scoring-factors.fixture";
import { useSetScoringFactors } from "./use-set-scoring-factors";
describe("useSetScoringFactors", () => {
  describeHookContract({
    kind: "mutation",
    hook: useSetScoringFactors,
    operationId: "setQuillsScoringFactors",
    request: {
      param: { workspaceId: "workspace_test_1" },
      json: { factors: [] },
    },
    response: setScoringFactorsFixture.ok(),
    viewer: { kind: "anonymous" },
    takesViewer: true,
    invalidates: [
      quillsOperationKey(
        "workspace_test_1",
        { kind: "anonymous" },
        "team",
        "getScoringFactors",
      ),
      quillsOperationKey(
        "workspace_test_1",
        { kind: "anonymous" },
        "team",
        "listPosts",
      ),
    ],
  });
});
