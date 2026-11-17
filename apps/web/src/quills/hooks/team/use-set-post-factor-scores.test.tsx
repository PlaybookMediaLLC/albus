import { describe } from "vite-plus/test";
import { describeHookContract } from "../../test/contracts";
import { quillsOperationKey } from "../../api/keys";
import { setPostFactorScoresFixture } from "../../api/team/set-post-factor-scores.fixture";
import { useSetPostFactorScores } from "./use-set-post-factor-scores";
describe("useSetPostFactorScores", () => {
  describeHookContract({
    kind: "mutation",
    hook: useSetPostFactorScores,
    operationId: "setQuillsPostFactorScores",
    request: {
      param: { workspaceId: "workspace_test_1", postId: "post-id_test_1" },
      json: { values: [] },
    },
    response: setPostFactorScoresFixture.ok(),
    viewer: { kind: "anonymous" },
    takesViewer: true,
    invalidates: [
      quillsOperationKey(
        "workspace_test_1",
        { kind: "anonymous" },
        "team",
        "listPosts",
      ),
      quillsOperationKey(
        "workspace_test_1",
        { kind: "anonymous" },
        "team",
        "getPost",
      ),
    ],
  });
});
