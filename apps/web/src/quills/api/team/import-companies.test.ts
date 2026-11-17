import { describe } from "vite-plus/test";
import { describeOperationContract } from "../../test/contracts";
import { importCompanies } from "./import-companies";
import { importCompaniesFixture } from "./import-companies.fixture";
describe("importCompanies", () => {
  describeOperationContract({
    operationId: "importQuillsCompanies",
    operation: importCompanies,
    request: {
      param: { workspaceId: "workspace_test_1" },
      json: { csv: "value" },
    },
    response: importCompaniesFixture.ok(),
    method: "post",
    path: "/api/quills/workspace_test_1/companies/import",
    statuses: [400, 401, 403, 429],
  });
});
