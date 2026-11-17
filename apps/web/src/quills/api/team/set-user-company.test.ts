import { describe } from "vite-plus/test";
import { describeOperationContract } from "../../test/contracts";
import { setUserCompany } from "./set-user-company";
import { setUserCompanyFixture } from "./set-user-company.fixture";
describe("setUserCompany", () => {
  describeOperationContract({
    operationId: "setQuillsUserCompany",
    operation: setUserCompany,
    request: {
      param: {
        workspaceId: "workspace_test_1",
        principalId: "principal-id_test_1",
      },
      json: {},
    },
    response: setUserCompanyFixture.ok(),
    method: "put",
    path: "/api/quills/workspace_test_1/users/principal-id_test_1/company",
    statuses: [401, 403, 404, 429],
  });
});
