import { describe } from "vite-plus/test";
import { describeHookContract } from "../../test/contracts";
import { deleteLogoFixture } from "../../api/team/delete-logo.fixture";
import { useDeleteLogo } from "./use-delete-logo";
describe("useDeleteLogo", () => {
  describeHookContract({
    kind: "mutation",
    hook: useDeleteLogo,
    operationId: "deleteQuillsLogo",
    request: { param: { workspaceId: "workspace_test_1" } },
    response: deleteLogoFixture.ok(),
    viewer: { kind: "anonymous" },
    takesViewer: false,
    invalidates: [],
  });
});
