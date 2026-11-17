import { describe } from "vite-plus/test";
import { describeHookContract } from "../../test/contracts";
import { listPostViewsFixture } from "../../api/team/list-post-views.fixture";
import { useListPostViews } from "./use-list-post-views";
describe("useListPostViews", () => {
  describeHookContract({
    kind: "query",
    hook: useListPostViews,
    operationId: "listQuillsPostViews",
    request: { param: { workspaceId: "workspace_test_1" } },
    emptyRequest: { param: { workspaceId: "" } },
    response: listPostViewsFixture.ok(),
    viewer: { kind: "anonymous" },
    takesViewer: false,
    invalidates: [],
  });
});
