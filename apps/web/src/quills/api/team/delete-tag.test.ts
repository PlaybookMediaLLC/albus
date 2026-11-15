import { describe } from "vite-plus/test";
import { describeOperationContract } from "../../test/contracts";
import { deleteTag } from "./delete-tag";
import { deleteTagFixture } from "./delete-tag.fixture";
describe("deleteTag", () => {
  describeOperationContract({
    operationId: "deleteQuillsTag",
    operation: deleteTag,
    request: {
      param: { workspaceId: "workspace_test_1", tagId: "tag-id_test_1" },
    },
    response: deleteTagFixture.ok(),
    method: "delete",
    path: "/api/quills/workspace_test_1/tags/tag-id_test_1",
    statuses: [401, 403, 404, 429],
  });
});
