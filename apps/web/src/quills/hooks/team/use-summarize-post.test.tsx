import { describe } from "vite-plus/test";
import { describeHookContract } from "../../test/contracts";
import { summarizePostFixture } from "../../api/team/summarize-post.fixture";
import { useSummarizePost } from "./use-summarize-post";
describe("useSummarizePost", () => {
  describeHookContract({
    kind: "mutation",
    hook: useSummarizePost,
    operationId: "summarizeQuillsPost",
    request: {
      param: { workspaceId: "workspace_test_1", postId: "post-id_test_1" },
    },
    response: summarizePostFixture.ok(),
    viewer: { kind: "anonymous" },
    takesViewer: false,
    invalidates: [],
  });
});
