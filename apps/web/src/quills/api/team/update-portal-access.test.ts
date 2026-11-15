import { describe } from "vite-plus/test";
import { describeOperationContract } from "../../test/contracts";
import { updatePortalAccess } from "./update-portal-access";
import { updatePortalAccessFixture } from "./update-portal-access.fixture";
describe("updatePortalAccess", () => {
  describeOperationContract({
    operationId: "updateQuillsPortalAccess",
    operation: updatePortalAccess,
    request: {
      param: { workspaceId: "workspace_test_1" },
      json: { visibility: "public" },
    },
    response: updatePortalAccessFixture.ok(),
    method: "put",
    path: "/api/quills/workspace_test_1/settings/portal/access",
    statuses: [401, 403, 429],
  });
});
