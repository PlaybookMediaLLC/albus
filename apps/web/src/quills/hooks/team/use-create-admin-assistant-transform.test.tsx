import { describe } from "vite-plus/test";
import { describeHookContract } from "../../test/contracts";
import { createAdminAssistantTransformFixture } from "../../api/team/create-admin-assistant-transform.fixture";
import { useCreateAdminAssistantTransform } from "./use-create-admin-assistant-transform";
describe("useCreateAdminAssistantTransform", () => {
  describeHookContract({
    kind: "mutation",
    hook: useCreateAdminAssistantTransform,
    operationId: "createQuillsAdminAssistantTransform",
    request: {
      param: { workspaceId: "workspace_test_1" },
      json: { kind: "more_friendly", text: "value" },
    },
    response: createAdminAssistantTransformFixture.ok(),
    viewer: { kind: "anonymous" },
    takesViewer: false,
    invalidates: [],
  });
});
