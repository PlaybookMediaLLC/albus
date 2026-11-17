import { describe } from "vite-plus/test";
import { describeHookContract } from "../../test/contracts";
import { quillsOperationKey } from "../../api/keys";
import { importCompaniesFixture } from "../../api/team/import-companies.fixture";
import { useImportCompanies } from "./use-import-companies";
describe("useImportCompanies", () => {
  describeHookContract({
    kind: "mutation",
    hook: useImportCompanies,
    operationId: "importQuillsCompanies",
    request: {
      param: { workspaceId: "workspace_test_1" },
      json: { csv: "value" },
    },
    response: importCompaniesFixture.ok(),
    viewer: { kind: "anonymous" },
    takesViewer: true,
    invalidates: [
      quillsOperationKey(
        "workspace_test_1",
        { kind: "anonymous" },
        "team",
        "getUserCompany",
      ),
      quillsOperationKey(
        "workspace_test_1",
        { kind: "anonymous" },
        "team",
        "listPosts",
      ),
      quillsOperationKey(
        "workspace_test_1",
        { kind: "anonymous" },
        "team",
        "getPostDemand",
      ),
      quillsOperationKey(
        "workspace_test_1",
        { kind: "anonymous" },
        "team",
        "getRevenueAtRisk",
      ),
    ],
  });
});
