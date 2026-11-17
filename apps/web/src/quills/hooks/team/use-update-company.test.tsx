import { describe } from "vite-plus/test";
import { describeHookContract } from "../../test/contracts";
import { quillsOperationKey } from "../../api/keys";
import { updateCompanyFixture } from "../../api/team/update-company.fixture";
import { useUpdateCompany } from "./use-update-company";
describe("useUpdateCompany", () => {
  describeHookContract({
    kind: "mutation",
    hook: useUpdateCompany,
    operationId: "updateQuillsCompany",
    request: {
      param: {
        workspaceId: "workspace_test_1",
        companyId: "company-id_test_1",
      },
      json: {},
    },
    response: updateCompanyFixture.ok(),
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
