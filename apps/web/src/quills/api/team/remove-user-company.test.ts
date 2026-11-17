import { describe } from "vite-plus/test";
import { describeOperationContract } from "../../test/contracts";
import { removeUserCompany } from "./remove-user-company";
import { removeUserCompanyFixture } from "./remove-user-company.fixture";
describe("removeUserCompany", () => {
  describeOperationContract({
    operationId: "removeQuillsUserCompany",
    operation: removeUserCompany,
    request: {
      param: {
        workspaceId: "workspace_test_1",
        principalId: "principal-id_test_1",
      },
    },
    response: removeUserCompanyFixture.ok(),
    method: "delete",
    path: "/api/quills/workspace_test_1/users/principal-id_test_1/company",
    statuses: [401, 403, 404, 429],
  });
});
