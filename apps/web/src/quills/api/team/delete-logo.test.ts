import { describe } from "vite-plus/test";
import { describeOperationContract } from "../../test/contracts";
import { deleteLogo } from "./delete-logo";
import { deleteLogoFixture } from "./delete-logo.fixture";
describe("deleteLogo", () => {
  describeOperationContract({
    operationId: "deleteQuillsLogo",
    operation: deleteLogo,
    request: { param: { workspaceId: "workspace_test_1" } },
    response: deleteLogoFixture.ok(),
    method: "delete",
    path: "/api/quills/workspace_test_1/settings/logo",
    statuses: [401, 403, 429],
  });
});
