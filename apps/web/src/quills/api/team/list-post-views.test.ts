import { describe } from "vite-plus/test";
import { describeOperationContract } from "../../test/contracts";
import { listPostViews } from "./list-post-views";
import { listPostViewsFixture } from "./list-post-views.fixture";
describe("listPostViews", () => {
  describeOperationContract({
    operationId: "listQuillsPostViews",
    operation: listPostViews,
    request: { param: { workspaceId: "workspace_test_1" } },
    response: listPostViewsFixture.ok(),
    method: "get",
    path: "/api/quills/workspace_test_1/post-views",
    statuses: [401, 403, 429],
  });
});
