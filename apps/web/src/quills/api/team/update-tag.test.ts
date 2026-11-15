import { describe } from "vite-plus/test";
import { describeOperationContract } from "../../test/contracts";
import { updateTag } from "./update-tag";
import { updateTagFixture } from "./update-tag.fixture";
describe("updateTag", () => {
  describeOperationContract({
    operationId: "updateQuillsTag",
    operation: updateTag,
    request: {
      param: { workspaceId: "workspace_test_1", tagId: "tag-id_test_1" },
      json: {},
    },
    response: updateTagFixture.ok(),
    method: "patch",
    path: "/api/quills/workspace_test_1/tags/tag-id_test_1",
    statuses: [401, 403, 404, 409, 429],
  });
});
