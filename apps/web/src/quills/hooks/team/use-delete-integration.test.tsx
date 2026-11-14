import { describe } from "vite-plus/test";
import { describeHookContract } from "../../test/contracts";
import { quillsOperationKey } from "../../api/keys";
import { deleteIntegrationFixture } from "../../api/team/delete-integration.fixture";
import { useDeleteIntegration } from "./use-delete-integration";
describe("useDeleteIntegration", () => {
  describeHookContract({
    kind: "mutation",
    hook: useDeleteIntegration,
    operationId: "deleteQuillsIntegration",
    request: {
      param: {
        workspaceId: "workspace_test_1",
        integrationId: "integration-id_test_1",
      },
    },
    response: deleteIntegrationFixture.ok(),
    viewer: { kind: "anonymous" },
    takesViewer: true,
    invalidates: [
      quillsOperationKey(
        "workspace_test_1",
        { kind: "anonymous" },
        "team",
        "listIntegrations",
      ),
    ],
  });
});
