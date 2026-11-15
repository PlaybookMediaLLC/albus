import { describe } from "vite-plus/test";
import { describeOperationContract } from "../../test/contracts";
import { createTag } from "./create-tag";
import { createTagFixture } from "./create-tag.fixture";
describe("createTag", () => {
  describeOperationContract({
    operationId: "createQuillsTag",
    operation: createTag,
    request: {
      param: { workspaceId: "workspace_test_1" },
      json: { name: "value" },
    },
    response: createTagFixture.ok(),
    method: "post",
    path: "/api/quills/workspace_test_1/tags",
    statuses: [401, 403, 409, 429],
  });
});
