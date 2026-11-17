import { describe } from "vite-plus/test";
import { describeOperationContract } from "../../test/contracts";
import { updateCompany } from "./update-company";
import { updateCompanyFixture } from "./update-company.fixture";
describe("updateCompany", () => {
  describeOperationContract({
    operationId: "updateQuillsCompany",
    operation: updateCompany,
    request: {
      param: {
        workspaceId: "workspace_test_1",
        companyId: "company-id_test_1",
      },
      json: {},
    },
    response: updateCompanyFixture.ok(),
    method: "put",
    path: "/api/quills/workspace_test_1/companies/company-id_test_1",
    statuses: [401, 403, 404, 409, 429],
  });
});
