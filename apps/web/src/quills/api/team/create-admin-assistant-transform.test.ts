import { describe } from "vite-plus/test";
import { describeOperationContract } from "../../test/contracts";
import { createAdminAssistantTransform } from "./create-admin-assistant-transform";
import { createAdminAssistantTransformFixture } from "./create-admin-assistant-transform.fixture";
describe("createAdminAssistantTransform", () => {
  describeOperationContract({
    operationId: "createQuillsAdminAssistantTransform",
    operation: createAdminAssistantTransform,
    request: {
      param: { workspaceId: "workspace_test_1" },
      json: { kind: "more_friendly", text: "value" },
    },
    response: createAdminAssistantTransformFixture.ok(),
    method: "post",
    path: "/api/quills/workspace_test_1/assistant/transform",
    statuses: [401, 403, 409, 429],
  });
});
